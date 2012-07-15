make install
stylus app/stylesheets/screen.styl -o public/stylesheets --use nib
stylus app/stylesheets/themes -o public/stylesheets/themes --use nib
/etc/init.d/documentup stop
/etc/init.d/documentup start