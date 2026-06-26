{{/*
  Standalone template for @goreleaser/sponsors.
  Rendered and injected between the <!-- sponsors:begin --> / <!-- sponsors:end -->
  markers of README.md by:
     npx -y @goreleaser/sponsors apply sponsors.json sponsors.tpl.md README.md
  Data available: .Sponsors, .Tiers, .ByTier (map keyed by tier id).
  Sponsor fields: .Name .Website .Image .Tier .LogoWithSize(size).
*/ -}}
<!-- auto-generated from sponsors.tpl.md by @goreleaser/sponsors, do not edit by hand -->
{{- if .Sponsors }}
<div align="center">
{{- with index .ByTier "gold" }}
  <p><strong>Gold sponsors</strong><br/>
  {{- range . }} <a href="{{ .Website }}" target="_blank" rel="noopener sponsored"><img src="{{ .LogoWithSize 96 }}" alt="{{ .Name }}" height="72"/></a>{{ end }}
  </p>
{{- end }}
{{- with index .ByTier "silver" }}
  <p><strong>Silver sponsors</strong><br/>
  {{- range . }} <a href="{{ .Website }}" target="_blank" rel="noopener sponsored"><img src="{{ .LogoWithSize 64 }}" alt="{{ .Name }}" height="52"/></a>{{ end }}
  </p>
{{- end }}
{{- with index .ByTier "bronze" }}
  <p><strong>Bronze sponsors</strong><br/>
  {{- range . }} <a href="{{ .Website }}" target="_blank" rel="noopener sponsored"><img src="{{ .LogoWithSize 48 }}" alt="{{ .Name }}" height="40"/></a>{{ end }}
  </p>
{{- end }}
{{- with index .ByTier "backer" }}
  <p><strong>Backers</strong><br/>
  {{ range . }}<a href="{{ .Website }}">{{ .Name }}</a> &nbsp;{{ end }}
  </p>
{{- end }}
</div>
{{- else }}
<p align="center"><em>node-cron doesn't have sponsors yet.</em> <a href="https://github.com/sponsors/node-cron">Be the first &rarr;</a></p>
{{- end }}
