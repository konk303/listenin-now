content_attr = {:type => "html"}
content_attr[:quirks] = "false" unless params["no_quirks"]
xml.instruct!
xml.Module do
  xml.ModulePrefs(
                  :title => "lisenin' now",
                  :description => :"last.fmの最近聴いたトラックを表示するmixiアプリ/opensocialガジェット",
                  :author => "konk303",
                  :author_email => "support+@konk303.com"
                  )  do
    xml.Require(:feature => "opensocial-0.8")
    xml.Require(:feature => "dynamic-height")
    xml.Require(:feature => "views")
    xml.Require(:feature => "minimessage")
    xml.Require(:feature => "analytics")
  end
  content_attr[:view] = "profile,home,canvas"
  xml.Content(content_attr) do
    xml.cdata!(haml :'app/head', :layout => false)
  end
  %w[home profile canvas].each do |location|
    content_attr[:view] = location
    xml.Content(content_attr) do
      xml.cdata!(haml :'app/analytics', :layout => false, :locals => {:location => location})
    end
  end
  content_attr[:view] = "profile,home,canvas"
  xml.Content(content_attr) do
    xml.cdata!(haml :'app/foot', :layout => false)
  end
end
