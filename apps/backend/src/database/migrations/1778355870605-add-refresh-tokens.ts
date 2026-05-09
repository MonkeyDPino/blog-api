import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRefreshTokens1778355870605 implements MigrationInterface {
  name = 'AddRefreshTokens1778355870605';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "refresh_tokens" ("id" SERIAL NOT NULL, "token_id" character varying(36) NOT NULL, "token_hash" character varying(72) NOT NULL, "user_id" integer NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_b4bffc4033b7bd52e241210710c" UNIQUE ("token_id"), CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b4bffc4033b7bd52e241210710" ON "refresh_tokens" ("token_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b4bffc4033b7bd52e241210710"`,
    );
    await queryRunner.query(`DROP TABLE "refresh_tokens"`);
  }
}
