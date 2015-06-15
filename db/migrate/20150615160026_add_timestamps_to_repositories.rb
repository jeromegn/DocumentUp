class AddTimestampsToRepositories < ActiveRecord::Migration
  def change
    add_column :repositories, :created_at, :datetime
    add_column :repositories, :updated_at, :datetime
  end
end
