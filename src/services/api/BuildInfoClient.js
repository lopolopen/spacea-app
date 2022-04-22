import axios from 'axios';
import _ from 'lodash';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const urls = [{
  key: 'CopUI',
  url: '/build-info.json',
}, {
  key: 'CopApi',
  url: `${API_BASE_URL}buildinfo.json`,
}];

class BuildInfoClient {
  static async getAll() {
    let infos = await Promise.all(urls.map(async ({ url }) => {
      let info;
      try {
        info = (await axios.get(url)).data;
      }
      catch {
        info = null;
      }
      return info;
    }));
    return new Map(_.zip(urls.map(u => u.key), infos));
  }

  // static async get(serviceKey) {
  //   let url = urls.find(({ key }) => key === serviceKey).url;
  //   if (!url) return null;
  //   let info;
  //   try {
  //     info = (await axios.get(url)).data;
  //   }
  //   catch {
  //     info = null;
  //   }
  //   return info;
  // }
}

export default BuildInfoClient;
