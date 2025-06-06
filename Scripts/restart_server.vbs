Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /c cd /d C:\Users\mateu\Documents\Projekty\Lody && pm2 restart server.js", 1, False
