import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSearchVector1778400000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE posts ADD COLUMN search_vector tsvector`,
    );
    await queryRunner.query(
      `UPDATE posts SET search_vector = to_tsvector('english', coalesce(title,'') || ' ' || coalesce(content,''))`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_posts_search_vector ON posts USING GIN(search_vector)`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_posts_search_vector`);
    await queryRunner.query(
      `ALTER TABLE posts DROP COLUMN IF EXISTS search_vector`,
    );
  }
}
