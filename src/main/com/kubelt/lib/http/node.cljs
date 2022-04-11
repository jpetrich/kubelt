(ns com.kubelt.lib.http.node
  "Support for HTTP requests from a Node.js execution context."
  {:copyright "©2022 Kubelt, Inc." :license "Apache 2.0"}
  (:require
   ["http" :as http :refer [IncomingMessage ServerResponse]]
   ["https" :as https])
  (:require
   [clojure.string :as str])
  (:require
   [malli.core :as malli]
   [malli.error :as me]
   [taoensso.timbre :as log])
  (:require
   [com.kubelt.lib.error :as lib.error]
   [com.kubelt.lib.http.media-type :as http.media-type]
   [com.kubelt.lib.http.request :as http.request]
   [com.kubelt.lib.http.shared :as http.shared]
   [com.kubelt.lib.json :as lib.json]
   [com.kubelt.lib.promise :refer [promise]]
   [com.kubelt.proto.http :as proto.http]
   [com.kubelt.spec.http :as spec.http]))


;; TODO test me
(defn request->node-options
  "Convert a Kubelt HTTP request map into a Node.js http(s) request
  options map."
  [m]
  {:pre [(map? m)]}
  (let [method (http.shared/request->method m)
        domain (http.shared/request->domain m)
        port (http.shared/request->port m)
        path (http.shared/request->path m)
        headers (http.shared/request->headers m)
        options {:method method
                 :hostname domain
                 :port port
                 :path path}
        options (cond-> options
                  ;; headers
                  (not (nil? headers))
                  (assoc :headers headers))]
    (clj->js options)))

;; Takes the response object generated by receipt of the upstream response.
(defn on-response
  [resolve ^ServerResponse res]
  ;; TODO inspect result type
  ;; TODO decode body
  (let [status-code (.-statusCode res)
        headers (.-headers res)
        response {:http/status status-code :http/headers headers}
        chunks #js []]
    (.on res "data"
         (fn [data]
           (.push chunks data)))
    (.on res "end"
         ;; TODO more generic response type handling
         ;; TODO give user option of getting JS object, avoiding conversion
         (fn []
           (let [headers (js->clj headers)
                 body (.join chunks "")
                 data-edn (cond
                            (http.media-type/text? headers)
                            body
                            (http.media-type/json? headers)
                            (lib.json/from-json body true)
                            :else body)]
             (resolve (assoc response :http/body data-edn)))))))

(defn on-error
  [error]
  (log/error error))

;; Public
;; -----------------------------------------------------------------------------
;; TODO support request headers
;; TODO put patch post delete
;; TODO convert response to response map
;; TODO validate response map

(defrecord HttpClient []
  proto.http/HttpClient
  (request!
    [this request]
    (promise
     (fn [resolve reject]
       (if-not (malli/validate spec.http/request request)
         (reject (lib.error/explain spec.http/request request))
         ;; The request map is valid, so fire off the request.
         (let [scheme (get request :uri/scheme :http)
               request-map (dissoc request :uri/scheme)
               options (request->node-options request-map)
               ;; If user specified :https as the request scheme, use the
               ;; Node.js "https" module to fire off the request. Default
               ;; to using the "http" module otherwise.
               request-mod (if (= :https scheme) https http)
               on-response (partial on-response resolve)
               node-req (.request request-mod options on-response)]
           (when (or (http.request/post? request)
                     (http.request/put? request))
             (if-let [data (get request-map :http/body)]
               (.write node-req data)))
           (doto node-req
             (.on "error" on-error)
             (.end))))))))