xml.instruct!
xml.urlset(:xmlns => "http://www.sitemaps.org/schemas/sitemap/0.9") do
  %w[/ /help /demo /updates /feedback /tech /author].each do |loc|
    xml.url do
      xml.loc(request.scheme + '://' + request.host + loc)
    end
  end
end
