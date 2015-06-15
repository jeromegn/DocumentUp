class CreatePages < ActiveRecord::Migration
  def change
    create_table :pages do |t|
      t.string :path, default: ''
      t.references :repository
      t.string :source
    end
    add_index :pages, :path
  end
end
