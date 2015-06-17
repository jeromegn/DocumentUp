class AddRepositoryToPage < ActiveRecord::Migration
  def change
    add_foreign_key :pages, :repositories, index: true
  end
end
