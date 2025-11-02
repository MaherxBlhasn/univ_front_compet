import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { spawn } from 'child_process'
import http from 'http'

let backendProcess = null
let mainWindow = null

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false
    },
    backgroundColor: '#f9fafb',
    titleBarStyle: 'default',
    minWidth: 1024,
    minHeight: 768
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.maximize() // Ouvrir en plein écran maximisé
    mainWindow.show()
    // DevTools can be opened with F12 or Ctrl+Shift+I (keyboard shortcut below)
  })

  // Add keyboard shortcut to toggle DevTools (F12 or Ctrl+Shift+I)
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12' || (input.control && input.shift && input.key === 'I')) {
      mainWindow.webContents.toggleDevTools()
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Launch the backend server and wait for it to be ready
  await startBackendServer()

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // IPC pour fermer l'application
  ipcMain.on('close-app', () => {
    app.quit()
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  // Kill backend process when app closes
  if (backendProcess) {
    backendProcess.kill()
    backendProcess = null
  }
  
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Function to check if backend is ready
function waitForBackend(maxAttempts = 30) {
  return new Promise((resolve, reject) => {
    let attempts = 0
    const checkBackend = () => {
      attempts++
      console.log(`Checking if backend is ready... (attempt ${attempts}/${maxAttempts})`)
      
      const req = http.get('http://127.0.0.1:5000/', (res) => {
        console.log('Backend is ready!')
        resolve()
      })
      
      req.on('error', (err) => {
        if (attempts >= maxAttempts) {
          console.error('Backend failed to start after', maxAttempts, 'attempts')
          reject(new Error('Backend startup timeout'))
        } else {
          setTimeout(checkBackend, 1000) // Wait 1 second before next attempt
        }
      })
      
      req.end()
    }
    
    // Start checking after 2 seconds (give backend time to initialize)
    setTimeout(checkBackend, 2000)
  })
}

// Function to start the backend server
async function startBackendServer() {
  const isDev = is.dev
  let pythonPath, backendScript, backendDir, pythonHome

  if (isDev) {
    // Development: use paths relative to project root
    pythonPath = join(__dirname, '..', '..', 'python', 'python.exe')
    backendScript = join(__dirname, '..', '..', 'backend', 'run_app.py')
    backendDir = join(__dirname, '..', '..', 'backend')
    pythonHome = join(__dirname, '..', '..', 'python')
  } else {
    // Production: use paths relative to the packaged app
    pythonPath = join(process.resourcesPath, 'python', 'python.exe')
    backendScript = join(process.resourcesPath, 'backend', 'run_app.py')
    backendDir = join(process.resourcesPath, 'backend')
    pythonHome = join(process.resourcesPath, 'python')
  }

  console.log('Starting backend server...')
  console.log('Python path:', pythonPath)
  console.log('Backend script:', backendScript)
  console.log('Backend dir:', backendDir)

  // Set up environment variables for Python
  const env = { ...process.env }
  env.PYTHONHOME = pythonHome
  env.PYTHONPATH = backendDir + ';' + join(pythonHome, 'Lib', 'site-packages')
  env.PYTHONUTF8 = '1'  // Enable UTF-8 mode for Python to handle emojis
  env.PYTHONIOENCODING = 'utf-8'  // Force UTF-8 for I/O operations
  
  console.log('PYTHONHOME:', env.PYTHONHOME)
  console.log('PYTHONPATH:', env.PYTHONPATH)
  
  // Start the backend process using the launcher script
  // windowsHide: true hides the CMD window on Windows
  backendProcess = spawn(pythonPath, [backendScript], {
    stdio: 'pipe', // Pipe output instead of inherit to hide console
    cwd: backendDir,
    env: env,
    windowsHide: true // Hide CMD window on Windows
  })

  backendProcess.on('error', (err) => {
    console.error('Failed to start backend:', err)
  })

  backendProcess.on('exit', (code) => {
    console.log(`Backend process exited with code ${code}`)
    backendProcess = null
  })

  console.log('Backend server process started, waiting for it to be ready...')
  
  // Wait for backend to be ready before continuing
  try {
    await waitForBackend()
    console.log('Backend is ready, continuing with app startup')
  } catch (error) {
    console.error('Backend failed to start:', error)
    // Show error dialog to user
    const { dialog } = require('electron')
    dialog.showErrorBox(
      'Backend Startup Error',
      'The application backend failed to start. Please try restarting the application.'
    )
  }
}

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
