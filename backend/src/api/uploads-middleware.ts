import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import fs from "fs"
import path from "path"

export function resolveUploadPath(
  uploadsDirectory: string,
  requestedPath: string | string[]
): string | null {
  const pathSegments = Array.isArray(requestedPath)
    ? requestedPath
    : [requestedPath]
  const resolvedUploadsDirectory = path.resolve(uploadsDirectory)
  const resolvedFilePath = path.resolve(resolvedUploadsDirectory, ...pathSegments)
  const relativePath = path.relative(resolvedUploadsDirectory, resolvedFilePath)

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    return null
  }

  return resolvedFilePath
}

export const serveLocalUpload = async (
  req: MedusaRequest,
  res: MedusaResponse,
  _next: MedusaNextFunction
) => {
  const requestedPath = req.params.path

  if (!requestedPath) {
    return res.status(400).json({ message: "Invalid file path" })
  }

  const uploadsDirectory = path.resolve(process.cwd(), "uploads")
  const filePath = resolveUploadPath(uploadsDirectory, requestedPath)

  if (!filePath) {
    return res.status(403).json({ message: "Access denied" })
  }

  try {
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" })
    }

    if (!fs.statSync(filePath).isFile()) {
      return res.status(400).json({ message: "Not a file" })
    }

    const contentTypes: Record<string, string> = {
      ".gif": "image/gif",
      ".jpeg": "image/jpeg",
      ".jpg": "image/jpeg",
      ".pdf": "application/pdf",
      ".png": "image/png",
      ".svg": "image/svg+xml",
      ".webp": "image/webp",
    }
    const extension = path.extname(filePath).toLowerCase()

    res.setHeader(
      "Content-Type",
      contentTypes[extension] || "application/octet-stream"
    )

    if (extension === ".pdf") {
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${path.basename(filePath)}"`
      )
    }

    fs.createReadStream(filePath).pipe(res)
  } catch (error) {
    console.error("[UploadsRoute] Error serving file:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}
