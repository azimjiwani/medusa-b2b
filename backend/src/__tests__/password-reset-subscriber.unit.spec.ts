import sgMail from "@sendgrid/mail"
import passwordResetHandler from "../subscribers/password-reset"

jest.mock("@sendgrid/mail", () => ({
  __esModule: true,
  default: {
    setApiKey: jest.fn(),
    send: jest.fn(),
  },
}))

describe("password reset subscriber", () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = {
      ...originalEnv,
      MEDUSA_STOREFRONT_URL: "https://store.example.com",
      MEDUSA_BACKEND_URL: "https://backend.example.com",
      SENDGRID_API_KEY: "test-api-key",
      SENDGRID_CUSTOMER_RESET_PASSWORD_TEMPLATE: "test-template-id",
      SENDGRID_FROM: "support@example.com",
    }

    jest.mocked(sgMail.send).mockResolvedValue([
      { statusCode: 202, headers: {} },
      null,
    ] as never)
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it("emails customers the exact Medusa-issued reset token", async () => {
    const token = "header.payload.signature"

    await passwordResetHandler({
      event: {
        data: {
          actor_type: "customer",
          entity_id: "customer@example.com",
          metadata: { first_name: "Ada" },
          token,
        },
      },
    } as never)

    expect(sgMail.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "customer@example.com",
        dynamicTemplateData: expect.objectContaining({
          first_name: "Ada",
          reset_password_url:
            `https://store.example.com/reset-password?token=${token}`,
        }),
      })
    )
  })
})
