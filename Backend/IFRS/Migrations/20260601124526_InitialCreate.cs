using System;
using System.Text.Json;
using IFRS.models;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace IFRS.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:Enum:public.user_role", "admin,data_entry,auditor");

            migrationBuilder.CreateTable(
                name: "branch",
                columns: table => new
                {
                    pk_branch_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    oracle_code = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    branch_code = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    branch_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    lessee = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_branch", x => x.pk_branch_id);
                });

            migrationBuilder.CreateTable(
                name: "lessor",
                columns: table => new
                {
                    pk_lessor_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    full_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    nic = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    address = table.Column<string>(type: "text", nullable: true),
                    bank_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    account_number = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    bank_code = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_lessor", x => x.pk_lessor_id);
                });

            migrationBuilder.CreateTable(
                name: "user",
                columns: table => new
                {
                    pk_user_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    password_hash = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    full_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    role = table.Column<UserRole>(type: "user_role", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user", x => x.pk_user_id);
                });

            migrationBuilder.CreateTable(
                name: "lease",
                columns: table => new
                {
                    pk_lease_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    fk_branch_id = table.Column<int>(type: "integer", nullable: true),
                    fk_lessor_id = table.Column<int>(type: "integer", nullable: true),
                    lease_no = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    lease_property_address = table.Column<string>(type: "text", nullable: true),
                    sqft = table.Column<int>(type: "integer", nullable: true),
                    start_date = table.Column<DateOnly>(type: "date", nullable: true),
                    end_date = table.Column<DateOnly>(type: "date", nullable: true),
                    extensions = table.Column<string>(type: "text", nullable: true),
                    number_of_years = table.Column<int>(type: "integer", nullable: true),
                    rent_advance = table.Column<decimal>(type: "numeric", nullable: true),
                    rent_advance_period = table.Column<int>(type: "integer", nullable: true),
                    refundable_deposit = table.Column<decimal>(type: "numeric", nullable: true),
                    notice_period_months = table.Column<int>(type: "integer", nullable: true),
                    remarks = table.Column<string>(type: "text", nullable: true),
                    agreement_value = table.Column<decimal>(type: "numeric", nullable: true),
                    annual_rate = table.Column<decimal>(type: "numeric", nullable: true),
                    utility_bill = table.Column<decimal>(type: "numeric", nullable: true),
                    wht_rate = table.Column<decimal>(type: "numeric", nullable: true),
                    vat_rate = table.Column<decimal>(type: "numeric", nullable: true),
                    lease_status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    is_paid_at_beginning = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_lease", x => x.pk_lease_id);
                    table.ForeignKey(
                        name: "FK_lease_branch_fk_branch_id",
                        column: x => x.fk_branch_id,
                        principalTable: "branch",
                        principalColumn: "pk_branch_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_lease_lessor_fk_lessor_id",
                        column: x => x.fk_lessor_id,
                        principalTable: "lessor",
                        principalColumn: "pk_lessor_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "entity_change_request",
                columns: table => new
                {
                    pk_entity_change_request_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    entity_id = table.Column<int>(type: "integer", nullable: false),
                    entity_type = table.Column<string>(type: "text", nullable: false),
                    operation = table.Column<string>(type: "text", nullable: false),
                    old_value_snapshot = table.Column<JsonElement>(type: "jsonb", nullable: true),
                    new_value_snapshot = table.Column<JsonElement>(type: "jsonb", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    requested_by = table.Column<int>(type: "integer", nullable: false),
                    requested_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    request_comments = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    reviewed_by = table.Column<int>(type: "integer", nullable: true),
                    reviewed_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    review_comments = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    entity_updated_at_snapshot = table.Column<DateTime>(type: "timestamp without time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_entity_change_request", x => x.pk_entity_change_request_id);
                    table.ForeignKey(
                        name: "FK_entity_change_request_user_requested_by",
                        column: x => x.requested_by,
                        principalTable: "user",
                        principalColumn: "pk_user_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_entity_change_request_user_reviewed_by",
                        column: x => x.reviewed_by,
                        principalTable: "user",
                        principalColumn: "pk_user_id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "notifications",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    message = table.Column<string>(type: "text", nullable: false),
                    type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    is_read = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    reference_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    reference_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_notifications", x => x.id);
                    table.ForeignKey(
                        name: "FK_notifications_user_user_id",
                        column: x => x.user_id,
                        principalTable: "user",
                        principalColumn: "pk_user_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "refresh_tokens",
                columns: table => new
                {
                    pk_refresh_token_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    fk_user_id = table.Column<int>(type: "integer", nullable: false),
                    token = table.Column<string>(type: "text", nullable: false),
                    expires_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_refresh_tokens", x => x.pk_refresh_token_id);
                    table.ForeignKey(
                        name: "FK_refresh_tokens_user_fk_user_id",
                        column: x => x.fk_user_id,
                        principalTable: "user",
                        principalColumn: "pk_user_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "lease_payment_schedule",
                columns: table => new
                {
                    pk_payment_schedule_id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    fk_lease_id = table.Column<int>(type: "integer", nullable: true),
                    lease_year = table.Column<int>(type: "integer", nullable: true),
                    gross_amount = table.Column<decimal>(type: "numeric", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_lease_payment_schedule", x => x.pk_payment_schedule_id);
                    table.ForeignKey(
                        name: "FK_lease_payment_schedule_lease_fk_lease_id",
                        column: x => x.fk_lease_id,
                        principalTable: "lease",
                        principalColumn: "pk_lease_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_entity_change_request_requested_at",
                table: "entity_change_request",
                column: "requested_at");

            migrationBuilder.CreateIndex(
                name: "IX_entity_change_request_requested_by",
                table: "entity_change_request",
                column: "requested_by");

            migrationBuilder.CreateIndex(
                name: "IX_entity_change_request_reviewed_by",
                table: "entity_change_request",
                column: "reviewed_by");

            migrationBuilder.CreateIndex(
                name: "IX_entity_change_request_status_entity_type_entity_id",
                table: "entity_change_request",
                columns: new[] { "status", "entity_type", "entity_id" });

            migrationBuilder.CreateIndex(
                name: "IX_lease_fk_branch_id",
                table: "lease",
                column: "fk_branch_id");

            migrationBuilder.CreateIndex(
                name: "IX_lease_fk_lessor_id",
                table: "lease",
                column: "fk_lessor_id");

            migrationBuilder.CreateIndex(
                name: "IX_lease_payment_schedule_fk_lease_id",
                table: "lease_payment_schedule",
                column: "fk_lease_id");

            migrationBuilder.CreateIndex(
                name: "IX_notifications_user_id_is_read",
                table: "notifications",
                columns: new[] { "user_id", "is_read" });

            migrationBuilder.CreateIndex(
                name: "IX_notifications_user_id_type_reference_type_reference_id",
                table: "notifications",
                columns: new[] { "user_id", "type", "reference_type", "reference_id" });

            migrationBuilder.CreateIndex(
                name: "IX_refresh_tokens_fk_user_id",
                table: "refresh_tokens",
                column: "fk_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_refresh_tokens_token",
                table: "refresh_tokens",
                column: "token",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "entity_change_request");

            migrationBuilder.DropTable(
                name: "lease_payment_schedule");

            migrationBuilder.DropTable(
                name: "notifications");

            migrationBuilder.DropTable(
                name: "refresh_tokens");

            migrationBuilder.DropTable(
                name: "lease");

            migrationBuilder.DropTable(
                name: "user");

            migrationBuilder.DropTable(
                name: "branch");

            migrationBuilder.DropTable(
                name: "lessor");
        }
    }
}
