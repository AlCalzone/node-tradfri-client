import bonjour from "bonjour";

const MDNS_NAME = "coap";

function findTradfri() {
  return new Promise((resolve, reject) => {

    function serviceUpListener(service) {
      if (!service || !service.txt || !service.name.startsWith("gw-")) {
	      return;
      }
      const foundDevice = {
        name: service.name,
        version: service.txt,
        addresses: service.addresses,
      };
      mdnsBrowser.stop();
      resolve(foundDevice);
    }
    const mdnsBrowser = bonjour.findOne({ type: MDNS_NAME, protocol: "udp" }, serviceUpListener);
    mdnsBrowser.start();
  });
}

module.exports = findTradfri;
