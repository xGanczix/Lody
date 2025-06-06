Set shell = CreateObject("Shell.Application")
Set folder = shell.BrowseForFolder(0, "Wybierz folder z server.js", 0, 0)

If folder Is Nothing Then
    MsgBox "Nie wybrano folderu.", 48, "Błąd"
    WScript.Quit
End If

selectedPath = folder.Self.Path

Set fso = CreateObject("Scripting.FileSystemObject")
If Not fso.FileExists(selectedPath & "\server.js") Then
    MsgBox "Plik server.js nie istnieje w wybranym folderze!", 48, "Błąd"
    WScript.Quit
End If

scriptsPath = selectedPath & "\Scripts"
If Not fso.FolderExists(scriptsPath) Then
    fso.CreateFolder(scriptsPath)
End If

startFile = scriptsPath & "\start_server.vbs"
stopFile = scriptsPath & "\stop_server.vbs"
restartFile = scriptsPath & "\restart_server.vbs"

' Tworzymy skrypty

' START
Set fileStart = fso.CreateTextFile(startFile, True)
fileStart.WriteLine "Set WshShell = CreateObject(""WScript.Shell"")"
fileStart.WriteLine "WshShell.Run ""cmd /c cd /d " & selectedPath & " && pm2 start server.js"", 1, False"
fileStart.Close

' STOP
Set fileStop = fso.CreateTextFile(stopFile, True)
fileStop.WriteLine "Set WshShell = CreateObject(""WScript.Shell"")"
fileStop.WriteLine "WshShell.Run ""cmd /c cd /d " & selectedPath & " && pm2 stop server.js"", 1, False"
fileStop.Close

' RESTART
Set fileRestart = fso.CreateTextFile(restartFile, True)
fileRestart.WriteLine "Set WshShell = CreateObject(""WScript.Shell"")"
fileRestart.WriteLine "WshShell.Run ""cmd /c cd /d " & selectedPath & " && pm2 restart server.js"", 1, False"
fileRestart.Close

' Pytanie o dodanie do autostartu
addToStartup = MsgBox("Czy dodać start_server.vbs do autostartu?", vbYesNo + vbQuestion, "Autostart")

If addToStartup = vbYes Then
    Set startupFolder = shell.NameSpace(&H7&) ' CSIDL_STARTUP
    If Not startupFolder Is Nothing Then
        startupPath = startupFolder.Self.Path
        fso.CopyFile startFile, startupPath & "\start_server.vbs", True
        MsgBox "start_server.vbs został dodany do autostartu.", vbInformation, "Autostart"
    Else
        MsgBox "Nie udało się uzyskać folderu autostartu.", vbExclamation, "Uwaga"
    End If
End If

' Pytanie o uruchomienie teraz
runNow = MsgBox("Czy uruchomić teraz start_server.vbs?", vbYesNo + vbQuestion, "Uruchom teraz")

If runNow = vbYes Then
    Set WshShell = CreateObject("WScript.Shell")
    WshShell.Run Chr(34) & startFile & Chr(34), 1, False
End If

MsgBox "Skrypty zostały utworzone w:" & vbCrLf & scriptsPath, vbInformation, "Sukces"
