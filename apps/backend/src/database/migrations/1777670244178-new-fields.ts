import { MigrationInterface, QueryRunner } from 'typeorm';

export class NewFields1777670244178 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "categories" ADD "description" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" ADD "cover_image" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" ALTER COLUMN "cover_image" TYPE character varying(800)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "posts" ALTER COLUMN "cover_image" TYPE character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" DROP COLUMN "cover_image"`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" DROP COLUMN "description"`,
    );
  }
}
