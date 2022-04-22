// import { svcApiClient } from "../axiosConfig";

// let { get, post, delete: del } = svcApiClient;

// class ServiceClient {
//   id;
//   options = {};
//   constructor(id, options) {
//     this.id = id;
//     if (options) this.options = options;
//   }

//   getApiKeys() {
//     return get(`/services/${this.id}/apikeys`);
//   }

//   static create(service, options) {
//     return post('/services', service, options);
//   }

//   static remove(id) {
//     return del(`/services/${id}`);
//   }

//   static all() {
//     return get('/services');
//   }
// }

// export default ServiceClient;
