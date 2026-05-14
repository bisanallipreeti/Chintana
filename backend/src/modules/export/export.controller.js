import { asyncHandler } from "../../core/utils/asyncHandler.js";
import { exportService } from "./export.service.js";

export const exportThoughtsCsv = asyncHandler(async (req, res) => {
  const result = await exportService.buildCsv(req.user._id, req.query);

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename=chintana-thoughts-${Date.now()}.csv`);
  res.setHeader("x-export-count", String(result.count));
  res.status(200).send(result.buffer);
});

export const exportThoughtsPdf = asyncHandler(async (req, res) => {
  const result = await exportService.buildPdf(req.user, req.query);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=chintana-thoughts-${Date.now()}.pdf`);
  res.setHeader("x-export-count", String(result.count));
  res.status(200).send(result.buffer);
});
