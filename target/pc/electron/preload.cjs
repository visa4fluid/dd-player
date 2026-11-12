const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('fluid', {
  platform: 'pc',
});
