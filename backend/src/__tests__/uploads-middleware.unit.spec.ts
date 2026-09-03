import path from "path"
import { resolveUploadPath } from "../api/uploads-middleware"

describe("resolveUploadPath", () => {
  const uploadsDirectory = path.resolve("/tmp/medusa-upload-test/uploads")

  it("resolves nested upload paths", () => {
    expect(resolveUploadPath(uploadsDirectory, ["invoices", "1", "file.pdf"]))
      .toBe(path.join(uploadsDirectory, "invoices", "1", "file.pdf"))
  })

  it("rejects paths outside the upload directory", () => {
    expect(resolveUploadPath(uploadsDirectory, ["..", "private.txt"]))
      .toBeNull()
  })
})
