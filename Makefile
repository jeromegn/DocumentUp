default : test

test:
	npm test

public/stylesheets:
	stylus app/stylesheets/screen.styl -o public/stylesheets --use nib
	stylus app/stylesheets/themes -o public/stylesheets/themes --use nib

install:
	npm install