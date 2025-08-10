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


  const custodians = [
    { name: "USTB", valueUSD: 312345678.23, change24h: 0.85 },
    { name: "WTGXX", valueUSD: 198765432.11, change24h: -0.42 },
    { name: "USDB", valueUSD: 425000000, change24h: 0 },
    { name: "BUIDL", valueUSD: 425000000, change24h: 0 },
  ];
  
  const totalsAllChains = {
    txCount: 142331,
    volumeUSD: 1823000000,
    uniqueWallets: 54981,
  };
  
  const flows = {
    inflowsUSD: 25000000,
    outflowsUSD: 18400000,
  };
  
  const netUSD = flows.inflowsUSD - flows.outflowsUSD;

  const fmtUSD = (n: number) =>
    n >= 1e9
      ? `$${(n / 1e9).toFixed(2)}B`
      : n >= 1e6
      ? `$${(n / 1e6).toFixed(2)}M`
      : n >= 1e3
      ? `$${(n / 1e3).toFixed(2)}K`
      : `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

  const pctColor = (v: number) => (v > 0 ? "#4caf50" : v < 0 ? "#ef5350" : "rgba(255,255,255,0.7)");
  const pctLabel = (v: number) => (v > 0 ? `▲ ${v.toFixed(2)}%` : v < 0 ? `▼ ${Math.abs(v).toFixed(2)}%` : "—");
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

  const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;
  const cutoffMs = now - FORTY_EIGHT_HOURS_MS;

  const recent48 = recent.filter(e => new Date(e.ts).getTime() >= cutoffMs);

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
      diff = Math.round(diff / limit);
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
                Total Redeemed (frxUSD)
              </Typography>
              <Typography variant="h6">{fmtUSDLong(totalRedeemed48)}</Typography>
            </Box>

            <Box sx={{ background: "#262626", border: "1px solid #333", borderRadius: "10px", p: 2 }}>
              <Typography variant="subtitle2" sx={{ opacity: 0.85 }}>
                Net (Minted − Redeemed)
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

        {/* Section 1: Custodian Values */}
        {/* <Box sx={{ textAlign: "left", mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Custodian Values
          </Typography>

          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", // flexible 4-column layout
            }}
          >
            {custodians.map((c) => (
              <Box
                key={c.name}
                sx={{
                  background: "#262626",
                  border: "1px solid #333",
                  borderRadius: "10px",
                  p: 2,
                }}
              >
                <Typography variant="subtitle2" sx={{ opacity: 0.85 }}>
                  {c.name}
                </Typography>
                <Typography variant="h6" sx={{ mt: 0.5 }}>
                  {fmtUSD(c.valueUSD)}
                </Typography>
                <Typography variant="caption" sx={{ color: pctColor(c.change24h) }}>
                  {pctLabel(c.change24h)} (24h)
                </Typography>
              </Box>
            ))}
          </Box>
        </Box> */}


        {/* Thin divider */}
        <Box sx={{ height: 1, background: "rgba(255,255,255,0.12)", my: 2 }} />

        {/* Section 2: Total Transfers · All Chains */}
        {/* <Box sx={{ textAlign: "left", mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Total Transfers · All Chains · Last 24 hrs
          </Typography>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
            <Box sx={{ flex: "1 1 200px", minWidth: 200, background: "#262626", border: "1px solid #333", borderRadius: "10px", p: 2 }}>
              <Typography variant="subtitle2" sx={{ opacity: 0.85 }}>
                Transfer Count
              </Typography>
              <Typography variant="h6">{totalsAllChains.txCount.toLocaleString()}</Typography>
            </Box>

            <Box sx={{ flex: "1 1 200px", minWidth: 200, background: "#262626", border: "1px solid #333", borderRadius: "10px", p: 2 }}>
              <Typography variant="subtitle2" sx={{ opacity: 0.85 }}>
                Volume (USD)
              </Typography>
              <Typography variant="h6">{fmtUSD(totalsAllChains.volumeUSD)}</Typography>
            </Box>

            <Box sx={{ flex: "1 1 200px", minWidth: 200, background: "#262626", border: "1px solid #333", borderRadius: "10px", p: 2 }}>
              <Typography variant="subtitle2" sx={{ opacity: 0.85 }}>
                Unique Wallets
              </Typography>
              <Typography variant="h6">{totalsAllChains.uniqueWallets.toLocaleString()}</Typography>
            </Box>
          </Box>
        </Box> */}

        {/* Thin divider */}
        <Box sx={{ height: 1, background: "rgba(255,255,255,0.12)", my: 2 }} />

        {/* Section 3: Inflows / Outflows */}
        {/* <Box sx={{ textAlign: "left", mb: 1 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Aggregate Inflows / Outflows · Last 24 hrs
          </Typography>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
            <Box sx={{ flex: "1 1 200px", minWidth: 200, background: "#262626", border: "1px solid #333", borderRadius: "10px", p: 2 }}>
              <Typography variant="subtitle2" sx={{ opacity: 0.85 }}>
                Inflows
              </Typography>
                <Typography variant="h6">{fmtUSD(flows.inflowsUSD)}</Typography>
            </Box>

            <Box sx={{ flex: "1 1 200px", minWidth: 200, background: "#262626", border: "1px solid #333", borderRadius: "10px", p: 2 }}>
              <Typography variant="subtitle2" sx={{ opacity: 0.85 }}>
                Outflows
              </Typography>
              <Typography variant="h6">{fmtUSD(flows.outflowsUSD)}</Typography>
            </Box>

            <Box sx={{ flex: "1 1 200px", minWidth: 200, background: "#262626", border: "1px solid #333", borderRadius: "10px", p: 2 }}>
              <Typography variant="subtitle2" sx={{ opacity: 0.85 }}>
                Net Flow
              </Typography>
              <Typography variant="h6" sx={{ color: netUSD >= 0 ? "#4caf50" : "#ef5350" }}>
                {fmtUSD(netUSD)}
              </Typography>
            </Box>
          </Box>
        </Box> */}

        {/* Divider */}
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
          border: "1px solid #444",
          boxShadow: "0 4px 15px rgba(255, 255, 255, 0.2)",
        }}
      >
       <TableContainer component={Paper} sx={{ background: "#333", color: "white", borderRadius: "10px", overflow: "hidden" }}>
        <Table size="small" stickyHeader>
          <TableHead
            sx={{
              "& .MuiTableCell-head": {
                backgroundColor: "#444",
                color: "white",
                fontWeight: 600,
                borderBottom: "1px solid #555",
              },
            }}
          >
            <TableRow>
              <TableCell align="center">Time</TableCell>
              <TableCell align="center">Type</TableCell>
              <TableCell align="center">frxUSD</TableCell>
              <TableCell align="center">Asset</TableCell>
              <TableCell align="center">Asset Value</TableCell>
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
                  sx={{ "&:hover": { background: "#555" }, cursor: "pointer" }}
                >
                  <TableCell align="center" sx={{ color: "white" }}>
                    {timeAgo(e.ts)}
                  </TableCell>

                  <TableCell align="center" sx={{ color: "white" }}>
                    <Chip
                      size="small"
                      label={e.type === "inflow" ? "Mint" : "Redeem"}
                      sx={{
                        bgcolor: e.type === "inflow" ? "rgba(76, 175, 80, 0.15)" : "rgba(239, 83, 80, 0.15)",
                        color: e.type === "inflow" ? "#4caf50" : "#ef5350",
                        border: `1px solid ${e.type === "inflow" ? "#2e7d32" : "#c62828"}`,
                      }}
                    />
                  </TableCell>

                  <TableCell align="center" sx={{ color: "white", whiteSpace: "nowrap" }}>
                    {fmtUSDLong(e.frxusd)}
                  </TableCell>

                  <TableCell align="center" sx={{ color: "white", whiteSpace: "nowrap" }}>
                    {e.asset} · {fmtUSDLong(e.assetAmount)}
                  </TableCell>

                  <TableCell align="center" sx={{ color: "white", whiteSpace: "nowrap" }}>
                    {fmtUSDLong(e.assetValueUSD)}
                  </TableCell>

                  <TableCell align="center" sx={{ color: "white" }}>
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

        {/* Pager */}
        <TablePagination
          component="div"
          count={recent.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[50]}  // lock at 50 per page
          sx={{
            background: "#333",
            color: "white",
            borderTop: "1px solid #555",
            ".MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows": { color: "white" },
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

