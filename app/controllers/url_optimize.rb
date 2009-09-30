# redirect *.html to *
get %r{(.*)\.html$} do |c|
  redirect c, 301
end
# redirect */index  to */
get %r{(.*/)index$} do |c|
  redirect c, 301
end
# redirect */  to *
get %r{(.+)/$} do |c|
  redirect c, 301
end
