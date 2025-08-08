"use client";

import { Box, Typography, Drawer, List, ListItem, ListItemText, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";
import { useReadContracts } from "wagmi";
import { useState, useMemo } from "react";
import { Address, parseAbi } from "viem";
import MenuIcon from "@mui/icons-material/Menu";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import GitHubIcon from "@mui/icons-material/GitHub";
import TwitterIcon from "@mui/icons-material/Twitter";
import TelegramIcon from "@mui/icons-material/Telegram";
import { url } from "inspector";
import { FRAXLEND_TVL_CODE_ARBITRUM, FRAXLEND_TVL_CODE_FRAXTAL, FRAXLEND_TVL_CODE_MAINNET } from "./utils";

const UsersPage = () => {
    const [isMenuOpen, setMenuOpen] = useState(false);
    const toggleMenu = () => setMenuOpen(!isMenuOpen);
    const usdyIds = [2, 4];
    const dummyData = useMemo(() => [
        { id: 1, address: "0x1b19c19393e2d034d8ff31ff34c81252fcbbee92", name: "OUSG", secured: 500, chainId: 1, isToken: true, overrideURL: "" },
        { id: 2, address: "0x96f6ef951840721adbf46ac996b59e0235cb985c", name: "USDY", secured: 300, chainId: 1, isToken: true, overrideURL: "" },
        { id: 3, address: "0xaf37c1167910ebC994e266949387d2c7C326b879", name: "rUSDY", secured: 200, chainId: 1, isToken: true, overrideURL: "", },
        { id: 4, address: "0x5bE26527e817998A7206475496fDE1E68957c5A6", name: "USDY", secured: 0, chainId: 5000, isToken: true, overrideURL: "" },
        { id: 5, address: "0x1", name: "Fraxlend", secured: 0, chainId: 1, isToken: false, overrideURL: "https://app.frax.finance/fraxlend/available-pairs" },
        { id: 6, address: "0x2", name: "Fraxlend", secured: 0, chainId: 42161, isToken: false, overrideURL: "https://app.frax.finance/fraxlend/available-pairs" },
        { id: 7, address: "0x2", name: "Fraxlend", secured: 0, chainId: 252, isToken: false, overrideURL: "https://app.frax.finance/fraxlend/available-pairs"  },
    ], []);

    const FRAXLEND_MAINNET = [
        "0x0601B72bEF2b3F09E9f48B7d60a8d7D2D3800C6e",
        "0xeca60a11c49486088Ad7c5e4aD7Dae2C061DBb1c",
    ]
    
    // 🛠️ Batch contract reads into a single hook
    const { data: contractReads } = useReadContracts({
        contracts: dummyData.slice(0,4).map(contract => ({
            address: contract.address as Address,
            abi: parseAbi(['function totalSupply() view returns(uint256)']),
            functionName: "totalSupply",
            chainId: contract.chainId,
        }))
    });


    const { data: fraxlendContractsMainnet } = useReadContracts({
        contracts: [{
            address: "0x7818D482843CB36577ae8a75c1F5bcf9748459C6" as Address,
            abi: parseAbi(['function getTVL() view returns(uint256)']),
            functionName: "getTVL",
            chainId: 1,
        }],
        stateOverride: [{
            address: "0x7818D482843CB36577ae8a75c1F5bcf9748459C6" as Address, // Explicitly specify the address inside the object
            code: FRAXLEND_TVL_CODE_MAINNET,
        }]
    });

    const { data: fraxlendContractsArbitrum } = useReadContracts({
        contracts: [{
            address: "0x7818D482843CB36577ae8a75c1F5bcf9748459C6" as Address,
            abi: parseAbi(['function getTVL() view returns(uint256)']),
            functionName: "getTVL",
            chainId: 42161,
        }],
        stateOverride: [{
            address: "0x7818D482843CB36577ae8a75c1F5bcf9748459C6" as Address, // Explicitly specify the address inside the object
            code: FRAXLEND_TVL_CODE_ARBITRUM,
        }]
    });


    const { data: fraxlendContractsFraxtal } = useReadContracts({
        contracts: [{
            address: "0x7818D482843CB36577ae8a75c1F5bcf9748459C6" as Address,
            abi: parseAbi(['function getTVL() view returns(uint256)']),
            functionName: "getTVL",
            chainId: 252,
        }],
        stateOverride: [{
            address: "0x7818D482843CB36577ae8a75c1F5bcf9748459C6" as Address, // Explicitly specify the address inside the object
            code: FRAXLEND_TVL_CODE_FRAXTAL,
        }]
    });
    
    // console.log("HEREL ", fraxlendContractsFraxtal)
    // console.log("~~~> ", fraxlendContractsArbitrum);

    const { data: priceOUSG } = useReadContracts({
        contracts: [{
            address: "0x0502c5ae08E7CD64fe1AEDA7D6e229413eCC6abe" as Address,
            abi: parseAbi(['function rwaPrice() view returns(uint256)']),
            functionName: "rwaPrice",
            chainId: 1,
        }]
    });

    const { data: priceUSDY } = useReadContracts({
        contracts: [{
            address: "0xA0219AA5B31e65Bc920B5b6DFb8EdF0988121De0" as Address,
            abi: parseAbi(['function getPrice() view returns(uint256)']),
            functionName: "getPrice",
            chainId: 1,
        }]
    });

    // ✅ Safely map contractReads data and apply price calculations
    const prices = useMemo(() => {
        if (!contractReads) return [];
        
        return contractReads.map((read, i) => {
            if (read?.result) {
                let price = read.result;
                if (i === 0 && priceOUSG?.[0]?.result) {
                    price = (price * priceOUSG[0].result) / BigInt(1e18);
                }
                if (usdyIds.includes(i) && priceUSDY?.[0]?.result) {
                    console.log(priceUSDY[0].result)
                    price = (price * priceUSDY[0].result) / BigInt(1e18);
                }
                return price;
            }
            return BigInt(0);
        });
    }, [contractReads, priceOUSG, fraxlendContractsMainnet, fraxlendContractsArbitrum, fraxlendContractsFraxtal]);

    if (fraxlendContractsMainnet && fraxlendContractsMainnet![0].result && prices.length == 4 && prices.length < 5) prices.push(fraxlendContractsMainnet![0].result)
    if (fraxlendContractsArbitrum && fraxlendContractsArbitrum![0].result && prices.length == 5 && prices.length < 6) prices.push(fraxlendContractsArbitrum![0].result)
    if (fraxlendContractsFraxtal && fraxlendContractsFraxtal![0].result && prices.length == 6 &&prices.length < 7) prices.push(fraxlendContractsFraxtal![0].result)
    


    const totalValue = useMemo(() => {
        if (prices.length == 7) return prices.reduce((acc, price) => acc + Number(price) / 1e18, 0);
        else return 0
    }, [prices]);
    const handleRowClick = (contract: { id?: number; address: string; name?: string; secured?: number; chainId: number; isToken: boolean; overrideURL: string}) => {
        if (contract.overrideURL.length == 0) {
            let urlBase; 
            if (contract.chainId === 1) urlBase = "etherscan.io";
            if (contract.chainId === 5000) urlBase = "mantlescan.xyz";
            urlBase += contract.isToken ? "/token" : "/contract";
            window.open(`https://${urlBase}/${contract.address}`, "_blank");
        } else {
            window.open(`${contract.overrideURL}`, "_blank");
        }
       
    };
    function getIdContent(chainId: number) {
        if (chainId == 1) return "https://etherscan.io/images/svg/brands/ethereum-original.svg";
        if (chainId == 5000) return "14446189.png";
        if (chainId == 42161) return "65c64d22f085ba9a0f8100e3_ArbitrumLogo.svg";
        if (chainId == 252) return "fraxtal.png";
    }
    function chainIdToName(chainId: number) {
        if (chainId == 1) return "ETH Mainnet";
    }

    return (
        <div>
            <Box sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100vh",
                background: "#000",
                color: "white",
                textAlign: "center",
            }}>
                {/* Menu */}
                <Box sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    padding: "20px 20px",
                    position: "absolute",
                    top: 0,
                }}>
                    <Box onClick={toggleMenu}>
                        <MenuIcon sx={{ color: "white", cursor: "pointer" }} />
                    </Box>
                </Box>

                <Typography variant="h4" gutterBottom>
                    TVS
                </Typography>
                <Typography variant="h4" gutterBottom>
                $ {totalValue.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                </Typography>
                <br></br>
                <Box sx={{
                    background: "#1f1f1f",
                    padding: "20px",
                    borderRadius: "15px",
                    maxWidth: "600px",
                    width: "90%",
                    textAlign: "center",
                    boxShadow: "0 4px 15px rgba(255, 255, 255, 0.2)",
                    border: "1px solid #444"
                }}>
                    <Typography variant="h4" gutterBottom>
                    👨🏽‍⚖️ Contracts 👨🏽‍⚖️
                    </Typography>
                    
                    {/* Table Section inside Contract Box */}
                    <TableContainer component={Paper} sx={{ background: "#333", color: "white", borderRadius: "10px", overflow: "hidden" }}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ background: "#444" }}>
                                    <TableCell sx={{ color: "white", textAlign: "center" }}>Chain</TableCell>
                                    <TableCell sx={{ color: "white", textAlign: "center" }}>Name</TableCell>
                                    <TableCell sx={{ color: "white", textAlign: "center" }}>Total Value</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {dummyData.map((contract, index) => (
                                    <TableRow key={contract.id} onClick={() => handleRowClick(contract)} sx={{ cursor: "pointer", '&:hover': { background: "#555" } }}>
                                       <TableCell sx={{ color: "white" }}>
                                            <img 
                                                src={getIdContent(contract.chainId)} 
                                                style={{ width: '20px', height: '21px', filter: 'invert(100%) grayscale(100%)', marginLeft: 'auto', marginRight: 'auto' }}
                                                alt="Contract Icon" // It's good practice to include an alt text
                                            />
                                        </TableCell>
                                        <TableCell sx={{ color: "white", textAlign: "center" }}>{contract.name}</TableCell>
                                        <TableCell sx={{ color: "white", textAlign: "center" }}>
                                            {prices[index] 
                                                ? `$ ${
                                                    (Math.round((Number(prices[index]) / 1e18) * 100) / 100)
                                                    .toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
                                                : "Loading..."}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            </Box>
            
            {/* Drawer for the menu */}
            <Drawer 
                anchor="left" 
                open={isMenuOpen} 
                onClose={toggleMenu}
                PaperProps={{ sx: { backgroundColor: "#848D72", width: 250 } }}
            >
                <List sx={{ width: 250, backgroundColor: '#848D72' }}>
                    <ListItem component="a" href="/">
                        <ListItemText primary="√ Root" />
                    </ListItem>
                    <ListItem component="a" href="/experience">
                        <ListItemText primary="💼 Experience" />
                    </ListItem>
                    <ListItem component="a" href="/contracts">
                        <ListItemText primary="👨🏽‍⚖️ Contracts" />
                    </ListItem>
                    <ListItem component="a" href="/articles">
                        <ListItemText primary="📰 Publications" />
                    </ListItem>
                    <ListItem component="a" href="https://www.linkedin.com/in/tac98/" target="_blank" sx={{ textDecoration: 'none', color: 'inherit' }}>
                    <LinkedInIcon sx={{ height: 20 }} /> <ListItemText primary="LinkedIn" />
                    </ListItem>
                    <ListItem component="a" href="https://github.com/tom2o17" target="_blank" sx={{ textDecoration: 'none', color: 'inherit' }}>
                    <GitHubIcon sx={{ height: 20 }} /> <ListItemText primary="GitHub" />
                    </ListItem>
                    <ListItem component="a" href="https://x.com/toms_twetter" target="_blank" sx={{ textDecoration: 'none', color: 'inherit' }}>
                    <TwitterIcon sx={{ height: 20 }} /> <ListItemText primary="Twitter" />
                    </ListItem>
                    <ListItem component="a" href="https://t.me/tom2o17" target="_blank" sx={{ textDecoration: 'none', color: 'inherit' }}>
                    <TelegramIcon sx={{ height: 20 }} /> <ListItemText primary="Telegram" />
                    </ListItem>
                </List>
            </Drawer>
        </div>
        
    );
};

export default UsersPage;
