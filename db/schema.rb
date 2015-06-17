# encoding: UTF-8
# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 20150617124754) do

  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"
  enable_extension "hstore"

  create_table "pages", force: :cascade do |t|
    t.string   "path",          default: ""
    t.integer  "repository_id"
    t.string   "source"
    t.string   "html"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "pages", ["path"], name: "index_pages_on_path", using: :btree

  create_table "repositories", force: :cascade do |t|
    t.string   "full_name"
    t.string   "branch",     default: "master"
    t.hstore   "config"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "repositories", ["full_name"], name: "index_repositories_on_full_name", using: :btree

  add_foreign_key "pages", "repositories"
end
