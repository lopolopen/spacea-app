import React from "react";

const StaticBaseUrl = "https://cdn.casbin.org";

const authInfo = {
  Lark: {
    // scope: "email",
    endpoint: "https://open.feishu.cn/open-apis/authen/v1/index",
  },
  WeChat: {
    scope: "snsapi_login",
    endpoint: "https://open.weixin.qq.com/connect/qrconnect",
    mpScope: "snsapi_userinfo",
    mpEndpoint: "https://open.weixin.qq.com/connect/oauth2/authorize"
  },
  GitLab: {
    scope: "read_user+profile",
    endpoint: "https://gitlab.com/oauth/authorize",
  },
  GitHub: {
    scope: "user:email+read:user",
    endpoint: "https://github.com/login/oauth/authorize",
  },
  DingTalk: {
    scope: "openid",
    endpoint: "https://login.dingtalk.com/oauth2/auth",
  }
};

export function getProviderUrl(provider) {
  if (provider.category === "OAuth") {
    const endpoint = authInfo[provider.type].endpoint;
    const urlObj = new URL(endpoint);

    let host = urlObj.host;
    let tokens = host.split(".");
    if (tokens.length > 2) {
      tokens = tokens.slice(1);
    }
    host = tokens.join(".");

    return `${urlObj.protocol}//${host}`;
  } 
}

export function getAuthUrl(application, provider, method) {
  if (application === null || provider === null) {
    return "";
  }

  let endpoint = authInfo[provider.type].endpoint;
  const redirectUri = `${window.location.origin}/callback`;
  const scope = authInfo[provider.type].scope;
  const state = getQueryParamsToState(application.name, provider.name, method);

  if (provider.type === "Google") {
    return `${endpoint}?client_id=${provider.clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code&state=${state}`;
  } else if (provider.type === "GitHub") {
    return `${endpoint}?client_id=${provider.clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code&state=${state}`;
  } else if (provider.type === "QQ") {
    return `${endpoint}?client_id=${provider.clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code&state=${state}`;
  } else if (provider.type === "WeChat") {
    if (navigator.userAgent.includes("MicroMessenger")) {
      return `${authInfo[provider.type].mpEndpoint}?appid=${provider.clientId2}&redirect_uri=${redirectUri}&state=${state}&scope=${authInfo[provider.type].mpScope}&response_type=code#wechat_redirect`;
    } else {
      return `${endpoint}?appid=${provider.clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code&state=${state}#wechat_redirect`;
    }
  } else if (provider.type === "Facebook") {
    return `${endpoint}?client_id=${provider.clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code&state=${state}`;
  } else if (provider.type === "DingTalk") {
    return `${endpoint}?client_id=${provider.clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code&state=${state}&prompt=consent`;
  } else if (provider.type === "Weibo") {
    return `${endpoint}?client_id=${provider.clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code&state=${state}`;
  } else if (provider.type === "Gitee") {
    return `${endpoint}?client_id=${provider.clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code&state=${state}`;
  } else if (provider.type === "LinkedIn") {
    return `${endpoint}?client_id=${provider.clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code&state=${state}`;
  } else if (provider.type === "WeCom") {
    if (provider.subType === "Internal") {
      if (provider.method === "Silent") {
        endpoint = authInfo[provider.type].silentEndpoint;
        return `${endpoint}?appid=${provider.clientId}&redirect_uri=${redirectUri}&state=${state}&scope=${scope}&response_type=code#wechat_redirect`;
      } else if (provider.method === "Normal") {
        endpoint = authInfo[provider.type].internalEndpoint;
        return `${endpoint}?appid=${provider.clientId}&agentid=${provider.appId}&redirect_uri=${redirectUri}&state=${state}&usertype=member`;
      } else {
        return `https://error:not-supported-provider-method:${provider.method}`;
      }
    } else if (provider.subType === "Third-party") {
      if (provider.method === "Silent") {
        endpoint = authInfo[provider.type].silentEndpoint;
        return `${endpoint}?appid=${provider.clientId}&redirect_uri=${redirectUri}&state=${state}&scope=${scope}&response_type=code#wechat_redirect`;
      } else if (provider.method === "Normal") {
        return `${endpoint}?appid=${provider.clientId}&redirect_uri=${redirectUri}&state=${state}&usertype=member`;
      } else {
        return `https://error:not-supported-provider-method:${provider.method}`;
      }
    } else {
      return `https://error:not-supported-provider-sub-type:${provider.subType}`;
    }
  } else if (provider.type === "Lark") {
    return `${endpoint}?app_id=${provider.clientId}&redirect_uri=${redirectUri}&state=${state}`;
  } else if (provider.type === "GitLab") {
    return `${endpoint}?client_id=${provider.clientId}&redirect_uri=${redirectUri}&state=${state}&response_type=code&scope=${scope}`;
  } else if (provider.type === "Adfs") {
    return `${provider.domain}/adfs/oauth2/authorize?client_id=${provider.clientId}&redirect_uri=${redirectUri}&state=${state}&response_type=code&nonce=casdoor&scope=openid`;
  } else if (provider.type === "Baidu") {
    return `${endpoint}?client_id=${provider.clientId}&redirect_uri=${redirectUri}&state=${state}&response_type=code&scope=${scope}&display=popup`;
  } else if (provider.type === "Alipay") {
    return `${endpoint}?app_id=${provider.clientId}&scope=auth_user&redirect_uri=${redirectUri}&state=${state}&response_type=code&scope=${scope}&display=popup`;
  } else if (provider.type === "Casdoor") {
    return `${provider.domain}/login/oauth/authorize?client_id=${provider.clientId}&redirect_uri=${redirectUri}&state=${state}&response_type=code&scope=${scope}`;
  } else if (provider.type === "Infoflow") {
    return `${endpoint}?appid=${provider.clientId}&redirect_uri=${redirectUri}?state=${state}`;
  } else if (provider.type === "Apple") {
    return `${endpoint}?client_id=${provider.clientId}&redirect_uri=${redirectUri}&state=${state}&response_type=code&scope=${scope}&response_mode=form_post`;
  } else if (provider.type === "AzureAD") {
    return `${endpoint}?client_id=${provider.clientId}&redirect_uri=${redirectUri}&state=${state}&response_type=code&scope=${scope}`;
  } else if (provider.type === "Slack") {
    return `${endpoint}?client_id=${provider.clientId}&redirect_uri=${redirectUri}&state=${state}&response_type=code&scope=${scope}`;
  } else if (provider.type === "Steam") {
    return `${endpoint}?openid.claimed_id=http://specs.openid.net/auth/2.0/identifier_select&openid.identity=http://specs.openid.net/auth/2.0/identifier_select&openid.mode=checkid_setup&openid.ns=http://specs.openid.net/auth/2.0&openid.realm=${window.location.origin}&openid.return_to=${redirectUri}?state=${state}`;
  } else if (provider.type === "Okta") {
    return `${provider.domain}/v1/authorize?client_id=${provider.clientId}&redirect_uri=${redirectUri}&state=${state}&response_type=code&scope=${scope}`;
  } else if (provider.type === "Douyin") {
    return `${endpoint}?client_key=${provider.clientId}&redirect_uri=${redirectUri}&state=${state}&response_type=code&scope=${scope}`;
  } else if (provider.type === "Custom") {
    return `${provider.customAuthUrl}?client_id=${provider.clientId}&redirect_uri=${redirectUri}&scope=${provider.customScope}&response_type=code&state=${state}`;
  } else if (provider.type === "Bilibili") {
    return `${endpoint}#/?client_id=${provider.clientId}&return_url=${redirectUri}&state=${state}&response_type=code`;
  }
}

export function getProviderLogoURL(provider) {
  if (provider.category === "OAuth") {
    if (provider.type === "Custom") {
      return provider.customLogo;
    }
    return `${StaticBaseUrl}/img/social_${provider.type.toLowerCase()}.png`;
  } else {
    return null;
  }
}

export function getProviderLogo(provider) {
  const idp = provider.type.toLowerCase().trim().split(" ")[0];
  const url = getProviderLogoURL(provider);
  return (
    <img width={30} height={30} src={url} alt={idp} />
  );
}


function getQueryParamsToState(applicationName, providerName, method) {
  let query = window.location.search;
  query = `${query}&application=${applicationName}&provider=${providerName}&method=${method}`;
  if (method === "link") {
    query = `${query}&from=${window.location.pathname}`;
  }
  return btoa(query);
}
