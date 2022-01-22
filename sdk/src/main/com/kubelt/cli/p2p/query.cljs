(ns com.kubelt.cli.p2p.query
  "Invoke the p2p (query) method."
  {:copyright "©2022 Kubelt, Inc." :license "UNLICENSED"}
  (:require
   [com.kubelt.cli.p2p.options :as cli.p2p]
   [com.kubelt.sdk.impl.p2p :as p2p]
   [com.kubelt.sdk.v1 :as sdk]))

(defonce command
  {:command "query <key>"
   :desc "Query a p2p namespace"

   :builder (fn [^Yargs yargs]
              (cli.p2p/options yargs)
              yargs)

   :handler (fn [args]
              (let [{:keys [key host port]} (js->clj args :keywordize-keys true)
                    maddr (str "/ip4/" host "/tcp/" port)
                    kbt (sdk/init {:p2p/read maddr :p2p/write maddr})
                    ;; TODO supply account details from somewhere;
                    ;; should we have a local wallet for development /
                    ;; testing?
                    account {:kubelt/type :kubelt.type/account
                             :account/public-key "xyzabc123"}]
                ;; TODO error handling
                (p2p/query! kbt account key)
                (sdk/halt! kbt)))})