class CreateRepositories < ActiveRecord::Migration
  def change
    enable_extension 'hstore' unless extension_enabled?('hstore')

    create_table :repositories do |t|
      t.string :full_name
      t.string :branch, default: 'master'
      t.hstore :config
    end

    add_index :repositories, :full_name
  end
end
