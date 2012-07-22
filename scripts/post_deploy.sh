source ~/.profile
make install
./node_modules/.bin/stylus app/stylesheets/screen.styl -o public/stylesheets --use nib
./node_modules/.bin/stylus app/stylesheets/themes -o public/stylesheets/themes --use nib
/etc/init.d/documentup stop
/etc/init.d/documentup start