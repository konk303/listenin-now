xml.instruct!
xml.Module do
  xml.ModulePrefs(
                  :title => "lisenin' now",
                  :description => :"last.fmの最近聴いたトラックを表示するmixiアプリ/opensocialガジェット"
                  )  do
    xml.Require(:feature => "opensocial-0.8")
    xml.Require(:feature => "dynamic-height")
    xml.Require(:feature => "views")
    xml.Require(:feature => "minimessage")
    xml.Require(:feature => "analytics")
  end
  xml.Content(:type => "html",
              :quirks => "false",
              :view => "profile,home,canvas"
              ) do
    xml.cdata!(haml :'app/head', :layout => false)
  end
  %w[home profile canvas].each do |location|
    xml.Content(:type => "html",
                :quirks => "false",
                :view => location
                ) do
      xml.cdata!(haml :'app/analytics', :layout => false, :locals => {:location => location})
    end
  end
  xml.Content(:type => "html",
              :quirks => "false",
              :view => "profile,home,canvas"
              ) do
    xml.cdata!(haml :'app/foot', :layout => false)
  end
end
