(ns com.kubelt.lib.rpc
  "Play with rpc."
  {:copyright "ⓒ2022 Proof Zero Inc." :license "Apache 2.0"}
  (:require
   [clojure.string :as cstr])
  (:require
   [com.kubelt.lib.promise :as lib.promise]
   [com.kubelt.rpc :as rpc]
   [com.kubelt.rpc.schema :as rpc.schema]
   [com.kubelt.sdk.v1.core :as sdk.core]))

(defn rpc-call& [sys api args]
  (lib.promise/promise
   (fn [resolve reject]
     (let [wallet-address (-> sys :crypto/wallet :wallet/address)
           client (-> {:uri/domain (-> sys :client/p2p :http/host)
                       :uri/port (-> sys :client/p2p :http/port)
                       :uri/scheme (-> sys :client/p2p :http/scheme)
                       :uri/path (cstr/join "" ["/@" wallet-address "/jsonrpc"])
                       :http/client (:client/http sys)
                       :rpc/jwt (get-in sys [:crypto/session :vault/tokens* wallet-address])}
                      rpc/init
                      (rpc.schema/schema api))
           request (rpc/prepare client (:method args) (or (:params args) {}))
           rpc-method (:method/name (:rpc/method request))
           rpc-params (:rpc/params request)]
       (if (:rpc-client-type args)
         (-> (sdk.core/call-rpc-method sys wallet-address rpc-method (into [] (vals rpc-params)))
             (lib.promise/then resolve)
             (lib.promise/catch reject))
         (-> (rpc/execute client request)
             (lib.promise/then #(resolve (-> % :http/body :result)))
             (lib.promise/catch reject)))))))