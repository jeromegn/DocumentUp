class AddHtmlToPages < ActiveRecord::Migration
  def change
    add_column :pages, :html, :string
  end
end
