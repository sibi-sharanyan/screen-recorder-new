import packageJson from "./package.json";

/**
 * After changing, please reload the extension at `chrome://extensions`
 */
const manifest: chrome.runtime.ManifestV3 = {
  manifest_version: 3,
  name: packageJson.name,
  version: packageJson.version,
  description: packageJson.description,
  options_page: "src/pages/options/index.html",
  background: {
    service_worker: "src/pages/background/index.js",
    type: "module",
  },
  action: {
    default_popup: "src/pages/popup/index.html",
    default_icon: "icon-34.png",
  },
  chrome_url_overrides: {
  },
  icons: {
    "128": "icon-128.png",
  },
  content_scripts: [
    {
      matches: ["http://*/*", "https://*/*", "<all_urls>"],
      js: ["src/pages/content/index.js"],
      // KEY for cache invalidation
      css: ["assets/css/contentStyle<KEY>.chunk.css"],
    },
  ],
  devtools_page: "src/pages/devtools/index.html",
  web_accessible_resources: [
    {
      resources: [
        "assets/js/*.js",
        "assets/css/*.css",
        "icon-128.png",
        "icon-34.png",
      ],
      matches: ["*://*/*"],
    },
  ],
  permissions: ["desktopCapture", "tabs", "identity", "storage", "unlimitedStorage"],
  key: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAlSvevtsEzU8wv4/pRZV5MtFikdNBH2fDEL/XtrE/XmvvBvdJQXkXUSGB/1WkuJfJvjGMEYJ03dkED8hwtTvVC77UXkckcG5os1AHsnwfKgCVIVu0odZvfTdUSVPi66yliTepAmqaTQ+9Vc+Hk2lJfSX6lEtREgDwUcmbTgQNehjl6GPv7j+jf9XKgAsHzFX/zoVX2EDxE817sh6ALjMVOzqO/BLXgGiELAkGTcIELgQoLJBWtX9pcbgUTRk3X/RO4wduScDBjL696HjYmeeyG/LaOvwFL3mN4k6Bcfiu/ZeFXcb+vps7J7/j82AHj1rsD4OwSXpR5+0XJXFt0xbACwIDAQAB",
  oauth2: {
    "client_id": "256117321992-l6hu00g2lim9nv46abov0td1s2qvjn2f.apps.googleusercontent.com",
    scopes: ["https://www.googleapis.com/auth/drive", "https://www.googleapis.com/auth/userinfo.email"]
  },
};

export default manifest;
