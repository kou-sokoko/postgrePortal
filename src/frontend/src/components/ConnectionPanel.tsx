import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Stack,
  InputAdornment,
} from "@mui/material";
import DnsOutlined from "@mui/icons-material/DnsOutlined";
import Storage from "@mui/icons-material/Storage";
import PersonOutlineOutlined from "@mui/icons-material/PersonOutlineOutlined";
import LockOutlined from "@mui/icons-material/LockOutlined";
import SettingsEthernet from "@mui/icons-material/SettingsEthernet";
import CloudDownload from "@mui/icons-material/CloudDownload";
import AddCircle from "@mui/icons-material/AddCircle";
import type { ConnectionInfo } from "../types/api";

interface ConnectionPanelProps {
  onFetch: (connInfo: ConnectionInfo) => void;
  onCreateDatabase: (connInfo: ConnectionInfo) => void;
}

const ConnectionPanel: React.FC<ConnectionPanelProps> = ({
  onFetch,
  onCreateDatabase,
}) => {
  const [host, setHost] = useState("localhost");
  const [database, setDatabase] = useState("postgres");
  const [user, setUser] = useState("postgres");
  const [password, setPassword] = useState("");
  const [port, setPort] = useState("5432");

  const handleFetch = () => {
    const connInfo: ConnectionInfo = {
      host,
      port: Number(port) || 5432,
      database,
      user,
      password,
    };
    onFetch(connInfo);
  };

  const handleCreate = () => {
    const connInfo: ConnectionInfo = {
      host,
      port: Number(port) || 5432,
      database,
      user,
      password,
    };
    onCreateDatabase(connInfo);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderBottom: "1px solid",
        borderColor: "divider",
        borderRadius: 0,
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{
          mb: 1.5,
          color: "text.secondary",
          textTransform: "uppercase",
          fontSize: "0.7rem",
          letterSpacing: "0.1em",
          fontWeight: 600,
        }}
      >
        Connection
      </Typography>
      <Stack spacing={1.5}>
        <TextField
          label="HOST"
          value={host}
          onChange={(e) => setHost(e.target.value)}
          fullWidth
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <DnsOutlined sx={{ fontSize: 18, color: "text.secondary" }} />
                </InputAdornment>
              ),
            },
          }}
        />
        <TextField
          label="Database"
          value={database}
          onChange={(e) => setDatabase(e.target.value)}
          fullWidth
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Storage sx={{ fontSize: 18, color: "text.secondary" }} />
                </InputAdornment>
              ),
            },
          }}
        />
        <TextField
          label="User"
          value={user}
          onChange={(e) => setUser(e.target.value)}
          fullWidth
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <PersonOutlineOutlined
                    sx={{ fontSize: 18, color: "text.secondary" }}
                  />
                </InputAdornment>
              ),
            },
          }}
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <LockOutlined
                    sx={{ fontSize: 18, color: "text.secondary" }}
                  />
                </InputAdornment>
              ),
            },
          }}
        />
        <TextField
          label="Port"
          value={port}
          onChange={(e) => setPort(e.target.value)}
          fullWidth
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SettingsEthernet
                    sx={{ fontSize: 18, color: "text.secondary" }}
                  />
                </InputAdornment>
              ),
            },
          }}
        />
        <Box sx={{ display: "flex", gap: 1, pt: 0.5 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<CloudDownload sx={{ fontSize: 18 }} />}
            onClick={handleFetch}
            sx={{ flex: 1 }}
          >
            取得
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<AddCircle sx={{ fontSize: 18 }} />}
            onClick={handleCreate}
            sx={{
              flex: 1,
              color: "#1a2027",
              background: "linear-gradient(135deg, #ffb300 0%, #ffa000 100%)",
            }}
          >
            作成
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
};

export default ConnectionPanel;
