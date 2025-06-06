Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /c cd /d C:\Users\mateu\Documents\Projekty\Lody && pm2 stop server.js", 1, False
