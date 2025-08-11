"use client";

import { Box, Typography, Link, Drawer, List, ListItem, ListItemText, TableContainer, TableRow, TableBody, Table, TableCell, Chip, TableHead, Skeleton, CircularProgress } from "@mui/material";
import { Language } from "@mui/icons-material";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
// import Sirt
import GitHubIcon from "@mui/icons-material/GitHub";
import TwitterIcon from "@mui/icons-material/Twitter";
import TelegramIcon from "@mui/icons-material/Telegram";
import { TablePagination } from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useEffect, useState } from "react";
import { Paper } from "@mui/material";
import { getLogs } from "viem/actions";
import { useContractLogsLast43200 } from "src/app/contracts/utils";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

import { createPublicClient } from "viem";
export default function Home() {
  const [recent, setRecent] = useState<CustodianEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!isMenuOpen);
  };

  const [page, setPage] = useState(0);
  const rowsPerPage = 50;

  useEffect(() => {
    // whenever the feed length changes (new fetch), go back to page 0
    setPage(0);
  }, [recent.length]);

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);

  // slice the current page
  const paged = recent.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);


  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const HOP_EVENT = "";
  
  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        const r = await fetch("/telegram-feed.json", { cache: "no-store" });
        if (!alive) return;
        if (r.ok) {
          const data = await r.json();
          setRecent(Array.isArray(data) ? data : []);
        }
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    const id = setInterval(load, 30000); 
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const {
    data = [],          // default to [] so .length is safe
    isLoading,          // first load
    isFetching,         // background refetches (optional)
    error,              // optional
  } = useContractLogsLast43200({
    chainId: 252,
    address: "0x2A2019b30C157dB6c1C01306b8025167dBe1803B",
    topic0: "0xdbfa1659e184c2a9ac37b95df45d50585f6cbed8e1ff61f52300a3af246b0dac",
  });

  let hopsLast48 = 0;
  // if (data) console.log(results.data.length);
  if (data) {
    hopsLast48 = data.length;
  }

  type CustodianEvent = {
    ts: string;
    type: "inflow" | "outflow"; // inflow = mint, outflow = burn
    frxusd: number;
    asset: string;
    assetAmount: number;
    assetValueUSD: number;
    txUrl: string;
    custodianUrl: string;
    assetUrl: string;
    userUrl: string;
  };

  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));

  const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;
  // const TWENTY_SEVEN = 27 * 60 * 60 *1000;
  const cutoffMs = now - FORTY_EIGHT_HOURS_MS;
  console.log(now);

  // const recent48 = recent.filter(e => new Date(e.ts).getTime() >= cutoffMs);
  const recent48 = recent.filter(e => {
  const tsMs = new Date(e.ts).getTime();
    console.log(
      `Comparing ${tsMs} (${new Date(e.ts).getTime()}) >= ${cutoffMs} (${new Date(cutoffMs).toISOString()})`
    );
    return tsMs >= cutoffMs;
  });

  const totalMinted48 = recent48
    .filter(e => e.type === "inflow")
    .reduce((sum, e) => sum + (e.frxusd || 0), 0);

  const totalRedeemed48 = recent48
    .filter(e => e.type === "outflow")
    .reduce((sum, e) => sum + (e.frxusd || 0), 0);

  const net48 = totalMinted48 - totalRedeemed48;


  const fmtUSDLong = (n: number) =>
    `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

  function timeAgo(iso: string, nowMs = now) {
    const d = new Date(iso).getTime();
    let diff = Math.round((d - nowMs) / 1000);
    const ranges: [number, Intl.RelativeTimeFormatUnit][] = [
      [60, "second"],
      [60, "minute"],
      [24, "hour"],
      [7, "day"],
      [4.34524, "week"],
      [12, "month"],           
    ];

    for (const [limit, unit] of ranges) {
      if (Math.abs(diff) < limit) return rtf.format(diff, unit);
      diff = Math.floor(diff / limit);
    }
    return rtf.format(diff, "year");
  }


  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh", // fills screen
        background: "#000",
        color: "white",
        textAlign: "center",
        py: 4,
        px: 2,
        overflowY: "auto",
      }}
    >
      <Box
        sx={{
          background: "#1f1f1f",
          padding: "20px",
          borderRadius: "15px",
          maxWidth: "900px",
          width: "92%",
          boxShadow: "0 4px 15px rgba(0, 0, 0, 0.3)",
          margin: "auto", // centers even if shorter than screen
        }}
      >
        <img
          src="https://static.frax.com/images/tokens/frxusd.png"
          alt="avatar"
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            marginBottom: "15px",
            display: "block",
            margin: "0 auto",
          }}
        />
        <br></br>
        <Typography variant="h4" gutterBottom>
          frxUSD Flows
        </Typography>
        <Typography
          variant="body1"
          sx={{
            borderBottom: "1px dotted white",
            paddingBottom: "10px",
            marginBottom: "16px",
            opacity: 0.9,
          }}
        >
          Realtime overview of Fraxnet Transfers and Flows.
        </Typography>

        {/* Section: 48h Summary */}
        <Box sx={{ textAlign: "left", mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            48-Hour Summary
          </Typography>

          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
            <Box sx={{ background: "#262626", border: "1px solid #333", borderRadius: "10px", p: 2 }}>
              <Typography variant="subtitle2" sx={{ opacity: 0.85 }}>
                Total Minted (frxUSD)
              </Typography>
              <Typography variant="h6">{fmtUSDLong(totalMinted48)}</Typography>
            </Box>

            <Box sx={{ background: "#262626", border: "1px solid #333", borderRadius: "10px", p: 2 }}>
              <Typography variant="subtitle2" sx={{ opacity: 0.85 }}>
                Total Burned (frxUSD)
              </Typography>
              <Typography variant="h6">{fmtUSDLong(totalRedeemed48)}</Typography>
            </Box>

            <Box sx={{ background: "#262626", border: "1px solid #333", borderRadius: "10px", p: 2 }}>
              <Typography variant="subtitle2" sx={{ opacity: 0.85 }}>
                Net (Minted − Burned)
              </Typography>
              <Typography variant="h6" sx={{ color: net48 >= 0 ? "#4caf50" : "#ef5350" }}>
                {fmtUSDLong(net48)}
              </Typography>
            </Box>
            {/* NEW FIELD: Fraxtal Hops */}
            {/* NEW FIELD: Fraxtal Hops */}
            <Box sx={{ background: "#262626", border: "1px solid #333", borderRadius: "10px", p: 2 }}>
              <Typography variant="subtitle2" sx={{ opacity: 0.85 }}>
                Fraxtal Hops
              </Typography>

              <Typography variant="h6" sx={{ display: "flex", alignItems: "center", minHeight: 28 }}>
                {isLoading ? (
                  // Option A: subtle numeric skeleton
                  <Skeleton variant="text" width={80} sx={{ bgcolor: "rgba(255,255,255,0.15)" }} />
                ) : error ? (
                  // Optional error fallback
                  <>—</>
                ) : (
                  hopsLast48.toLocaleString()
                )}

                {/* Optional: tiny spinner on background refetches without replacing the number */}
                {!isLoading && !error && isFetching && (
                  <CircularProgress size={14} sx={{ ml: 1 }} />
                )}
              </Typography>
            </Box>

          </Box>

          {/* Tiny caption to clarify window */}
          <Typography variant="caption" sx={{ mt: 1, display: "block", opacity: 0.75 }}>
            Rolling last 48 hours from now.
          </Typography>
        </Box>

        
        <Box sx={{ height: 1, background: "rgba(255,255,255,0.12)", my: 2 }} />

        {/* Thin divider */}
        <Box sx={{ height: 1, background: "rgba(255,255,255,0.12)", my: 2 }} />

       
        <Box sx={{ height: 1, background: "rgba(255,255,255,0.12)", my: 2 }} />

{/* Section 4: Recent Custodian Activity */}
    <Box sx={{ textAlign: "left", mb: 1 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Recent Custodian Activity
      </Typography>

      <Box
        sx={{
          background: "#1f1f1f",
          p: 2,
          borderRadius: "15px",
          maxWidth: 900,
          width: "100%",             // was 92%
          mx: "auto",
          boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
        }}
      >
      <TableContainer
        component={Paper}
        sx={{
          background: "#333",
          color: "white",
          borderRadius: "10px",
          overflow: "hidden",
          overflowX: "auto",           // <- horizontal scroll safety
        }}
      >
        <Table size="small" stickyHeader={!isXs}>  {/* disable sticky on xs */}
          <TableHead
            sx={{
              "& .MuiTableCell-head": {
                backgroundColor: "#444",
                color: "white",
                fontWeight: 600,
                borderBottom: "1px solid #555",
                px: { xs: 1, sm: 2 },  // tighter padding on xs
                py: { xs: 1, sm: 1.5 },
              },
            }}
          >
            <TableRow>
              <TableCell align="center">Time</TableCell>
              <TableCell align="center">Type</TableCell>
              <TableCell align="center">frxUSD</TableCell>

              {/* Hide on phones */}
              <TableCell align="center" sx={{ display: { xs: "none", sm: "table-cell" } }}>
                Asset
              </TableCell>
              <TableCell align="center" sx={{ display: { xs: "none", sm: "table-cell" } }}>
                Asset Value
              </TableCell>

              <TableCell align="center">Links</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {paged.length === 0 ? (
              <TableRow>
                <TableCell align="center" colSpan={6} sx={{ color: "rgba(255,255,255,0.7)" }}>
                  No activity
                </TableCell>
              </TableRow>
            ) : (
              paged.map((e, i) => (
                <TableRow
                  key={`${e.ts}-${page}-${i}`}
                  onClick={isXs ? () => window.open(e.txUrl, "_blank", "noopener,noreferrer") : undefined}
                  sx={{
                    height: 44,
                    "&:hover": { background: "#555" },
                    cursor: "pointer",
                    "& .MuiTableCell-root": {
                      px: { xs: 1, sm: 2 },
                      py: { xs: 1, sm: 1.25 },
                      whiteSpace: { xs: "normal", sm: "nowrap" }, // wrap on xs
                      
                    },
                  }}
                >
                  <TableCell
                    align="center"
                    sx={{
                      color: "white",
                      minWidth: 80,        // prevents it from shrinking too much
                      maxWidth: 90,        // keeps column from expanding
                      whiteSpace: "normal", // allow wrapping
                      lineHeight: 1.2,      // tighter text
                      py: 0.5,              // less vertical padding
                    }}
                  >
                    {timeAgo(e.ts)}
                  </TableCell>

                  <TableCell align="center" sx={{ color: "white" }}>
                    <Chip
                      size="small"
                      label={e.type === "inflow" ? "Mint" : "Burn"}
                      sx={{
                        bgcolor: e.type === "inflow" ? "rgba(76,175,80,0.15)" : "rgba(239,83,80,0.15)",
                        color: e.type === "inflow" ? "#4caf50" : "#ef5350",
                        border: `1px solid ${e.type === "inflow" ? "#2e7d32" : "#c62828"}`,
                        height: 22,
                        "& .MuiChip-label": { px: 1 },
                      }}
                    />
                  </TableCell>

                  <TableCell align="center" sx={{ color: "white" }}>
                    {fmtUSDLong(e.frxusd)}
                  </TableCell>

                  {/* Hidden on xs */}
                  <TableCell
                    align="center"
                    sx={{ color: "white", display: { xs: "none", sm: "table-cell" } }}
                  >
                    {e.asset} · {fmtUSDLong(e.assetAmount)}
                  </TableCell>

                  <TableCell
                    align="center"
                    sx={{ color: "white", display: { xs: "none", sm: "table-cell" } }}
                  >
                    {fmtUSDLong(e.assetValueUSD)}
                  </TableCell>

                  <TableCell 
                    align="center" 
                    sx={{ 
                      color: "white",
                      display: { xs: "none", sm: "table-cell" }, // hide on mobile
                      cursor: "pointer",
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "center", gap: 1, flexWrap: "wrap" }}>
                      <Link href={e.txUrl} target="_blank" rel="noopener" sx={{ color: "white" }}>
                        Tx <OpenInNewIcon sx={{ fontSize: 14, ml: 0.25 }} />
                      </Link>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {/* Pagination: shrink text on xs */}
        <TablePagination
          component="div"
          count={recent.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[50]}
          sx={{
            background: "#333",
            color: "white",
            borderTop: "1px solid #555",
            ".MuiTablePagination-toolbar": { px: { xs: 1, sm: 2 } },
            ".MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows": {
              color: "white",
              fontSize: { xs: 12, sm: 14 },
            },
            ".MuiSvgIcon-root": { color: "white" },
            ".Mui-disabled": { color: "rgba(255,255,255,0.4) !important" },
          }}
        />
      </TableContainer>

      </Box>
    </Box>

        
        {/* Footer link(s) */}
        <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mt: 2 }}>
          <Link href="https://www.frax.com/" target="_blank" sx={{ color: "white" }}>
            <Language sx={{ fontSize: 30 }} />
          </Link>
        </Box>
      </Box>
    </Box>
  );
}

