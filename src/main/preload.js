const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // Comunicação para Menus de Contexto e Clipboard
    showContextMenu: (taskText) => ipcRenderer.send('show-context-menu', taskText),
    
    // Comunicação para Badges (Timers)
    startTimer: () => ipcRenderer.send('timer-started'),
    stopTimer: () => ipcRenderer.send('timer-stopped'),
    updateBadge: (count) => ipcRenderer.send('update-badge', taskText),

    // Comunicação bidirecional (Invocar e esperar resposta)
    exportTasks: (tasks) => ipcRenderer.invoke('export-tasks', tasks),
    
    // Escutando atalhos globais
    onFocusInput: (callback) => ipcRenderer.on('focus-input', callback),

    showNativeNotification: (title, body) => 
    ipcRenderer.send('show-native-notification', title, body),

    fetchSuggestion: () => ipcRenderer.invoke('fetch-suggestion')


});



