const { app, BrowserWindow, ipcMain, Menu, Tray, globalShortcut, dialog, shell, clipboard, Notification, net, nativeTheme } = require('electron');

const path = require('path');
const fs = require('fs');

let mainWindow;
let tray;
let activeTimers = 0;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 600,
        height: 700,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    setupApplicationMenu();
}

// ==========================================================
// 1. MENU DA APLICAÇÃO E SHELL (O Mapa Global)
// ==========================================================
function setupApplicationMenu() {
    const template = [
        {
            label: 'Arquivo',
            submenu: [
                { role: 'quit', label: 'Sair do To-Do' }
            ]
        },
        {
            label: 'Editar',
            submenu: [
                {role:'undo', label: 'Desfazer'},
                {role:'redo', label: 'Refazer'},
                {type:'separator'},
                {role:'cut', label: 'Cortar'},
                {role:'copy', label: 'Copiar'},
                {role:'paste', label: 'Colar'},
            ],
            label: 'Visualizar',
            submenu: [
                {role:'reload', label: 'Recarregar'},
                {role:'toggledevtools', label: 'Ferramentas'},
                {type:'separator'},
                {role:'togglefullscreen', label: 'Tela Cheia'}
            ]
        }
    ];
    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ==========================================================
// CICLO DE VIDA DO APP
// ==========================================================
app.whenReady().then(() => {
    createWindow();
    setupTray();
    setupGlobalShortcuts();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

// LIMPEZA ÉTICA: Removendo atalhos ao fechar
app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});

// ==========================================================
// 2. SYSTEM TRAY (A Vida Oculta)
// ==========================================================
function setupTray() {
    
    const iconPath = path.join(__dirname, 'icon.png');
    tray = new Tray(iconPath);
    
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Mostrar App', click: () => mainWindow.show() },
        { role: 'quit', label: 'Sair' }
    ]);
    
    tray.setToolTip('To-Do Timer');
    tray.setContextMenu(contextMenu);
}

// ==========================================================
// 3. MENU DE CONTEXTO E CLIPBOARD (Ação Cirúrgica)
// ==========================================================
ipcMain.on('show-context-menu', (event, taskText) => {
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Copiar Tarefa',
            click: () => {
                // CLIPBOARD: Copia sem o usuário usar Ctrl+C
                clipboard.writeText(taskText);
            }
        },
        { type: 'separator' },
        { role: 'delete', label: 'Remover' } // Exemplo de Role nativa
    ]);
    contextMenu.popup(BrowserWindow.fromWebContents(event.sender));
});

// ==========================================================
// 4. BADGES (Notificações Silenciosas)
// ==========================================================
ipcMain.on('timer-started', () => {
    activeTimers++;
    app.setBadgeCount(activeTimers); // Interrupção passiva: bolinha vermelha no ícone
});

ipcMain.on('timer-stopped', () => {
    if (activeTimers > 0) activeTimers--;
    app.setBadgeCount(activeTimers);
});

// atualiza a bolinha vermelha
ipcMain.on('update-badge', (event, count)=>{
    app.setBadgeCount(count);
});

ipcMain.on('show-native-notification', (event, title, body) => {
    if(Notification.isSupported()){
        new Notification.isSupported({
            title: title,
            body: body,
            icon: path.join(__dirname, 'icon.png')
        }).show();
    }
});


ipcMain.handle('fetch-suggestion', () => {
    return new Promise((resolve, reject) => {
        const request = net.request('http://dummyjson.com/quotes/random');

        request.on('response', (response)=>{
            let body = '';
            response.on('data', (chunk)=> body += chunk);
            response.on('end',() => {
                try {
                    const data = JSON.parse(body);
                    resolve(data.quote);
                } catch (e){
                    reject('Erro ao interpretar os dados');
                }
            })
        })
    })
});


// ==========================================================
// 5. DIALOG E SHELL (Exportação Segura)
// ==========================================================
ipcMain.handle('export-tasks', async (event, tasksString) => {
    try {
        const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
            title: 'Salvar Lista de Tarefas',
            defaultPath: 'minhas_tarefas.txt',
            filters: [{ name: 'Arquivos de Texto', extensions: ['txt'] }]
        });

        if (!canceled && filePath) {
            fs.writeFileSync(filePath, tasksString);
            shell.showItemInFolder(filePath);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Erro ao salvar tarefas:', error);
        return false;
    }
});

// ==========================================================
// 6. GLOBAL SHORTCUTS (Não sendo um sequestrador)
// ==========================================================
function setupGlobalShortcuts() {
    // Usamos um atalho complexo para não sobrepor funções do SO
    const success = globalShortcut.register('CommandOrControl+Shift+T', () => {
        if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
            // Pede ao Renderer para dar foco no input
            mainWindow.webContents.send('focus-input'); 
        }
    });

    if (!success) {
        console.warn('O atalho global falhou ou já está em uso.');
    }
}

// ==========================================================
// 7. TIMER AJUSTÁVEL (Configuração Dinâmica)
// ==========================================================
ipcMain.handle('adjust-timer', (event, duration) => {
    try {
        if (typeof duration !== 'number' || duration <= 0) {
            throw new Error('Duração inválida. Deve ser um número positivo.');
        }
        console.log(`Timer ajustado para ${duration} segundos.`);
        return true;
    } catch (error) {
        console.error('Erro ao ajustar o timer:', error);
        return false;
    }
});