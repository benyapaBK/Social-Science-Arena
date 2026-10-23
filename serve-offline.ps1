$root = Join-Path $PSScriptRoot 'offline'
$port = 4173
$mime = @{ '.html'='text/html; charset=utf-8'; '.js'='text/javascript'; '.css'='text/css'; '.svg'='image/svg+xml'; '.png'='image/png'; '.jpg'='image/jpeg'; '.json'='application/json'; '.mp3'='audio/mpeg'; '.mp4'='video/mp4'; '.woff2'='font/woff2' }
$l = New-Object System.Net.HttpListener
$l.Prefixes.Add("http://localhost:$port/")
$l.Start()
Write-Host "Running at http://localhost:$port  (close this window to stop)"
Start-Process "http://localhost:$port/"
while ($l.IsListening) {
  $c = $l.GetContext()
  $rel = [Uri]::UnescapeDataString($c.Request.Url.AbsolutePath).TrimStart('/')
  if ($rel -eq '') { $rel = 'index.html' }
  $f = Join-Path $root $rel
  if (-not (Test-Path $f -PathType Leaf) -or -not $f.StartsWith($root)) { $f = Join-Path $root 'index.html' }
  $b = [IO.File]::ReadAllBytes($f)
  $ext = [IO.Path]::GetExtension($f).ToLower()
  $c.Response.ContentType = if ($mime[$ext]) { $mime[$ext] } else { 'application/octet-stream' }
  $c.Response.OutputStream.Write($b, 0, $b.Length)
  $c.Response.Close()
}
