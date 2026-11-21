/**
 * Curated, production-grade boilerplate code samples for 35+ programming languages.
 * Realistic, idiomatic examples that developers can immediately understand and use.
 */

export const SAMPLES = {
  python: `from fastapi import FastAPI, HTTPException\n\napp = FastAPI(title="DevShare API")\n\n@app.get("/items/{item_id}")\nasync def read_item(item_id: int):\n    if item_id < 0:\n        raise HTTPException(status_code=400, detail="Invalid ID")\n    return {"item_id": item_id, "status": "active"}`,

  typescript: `interface ApiResponse<T> {\n  data: T;\n  status: 'success' | 'error';\n  timestamp: number;\n}\n\nexport async function fetchData<T>(url: string): Promise<ApiResponse<T>> {\n  const res = await fetch(url);\n  if (!res.ok) throw new Error(\`HTTP \${res.status}\`);\n  const data = await res.json();\n  return { data, status: 'success', timestamp: Date.now() };\n}`,

  javascript: `// Modern ES2024 Async Workflow\nexport async function processQueue(items = []) {\n  const results = await Promise.allSettled(\n    items.map(async (item) => {\n      const res = await fetch(\`/api/items/\${item.id}\`);\n      return res.json();\n    })\n  );\n  return results.filter(r => r.status === 'fulfilled').map(r => r.value);\n}`,

  jsx: `import React, { useState, useEffect } from 'react';\n\nexport function CounterCard({ title = "DevShare Metric" }) {\n  const [count, setCount] = useState(0);\n\n  return (\n    <div className="p-4 rounded-xl border bg-card shadow-sm">\n      <h3 className="text-lg font-bold">{title}</h3>\n      <p className="text-2xl font-mono my-2">{count}</p>\n      <button onClick={() => setCount(c => c + 1)} className="btn-primary">\n        Increment\n      </button>\n    </div>\n  );\n}`,

  ipynb: `# In [1]:\nimport pandas as pd\nimport numpy as np\n\n# Benchmark performance data\ndf = pd.DataFrame({\n    "runtime": ["Bun", "Node.js", "Deno"],\n    "req_per_sec": [128000, 48000, 62000],\n    "latency_ms": [1.2, 4.8, 3.1]\n})\ndf.describe()\n\n# Out [1]:\n#   req_per_sec  latency_ms\n# count          3.00        3.00\n# mean       79333.33        3.03`,

  sql: `-- PostgreSQL: CTE with window function\nWITH monthly_stats AS (\n  SELECT\n    author_id,\n    DATE_TRUNC('month', created_at) AS post_month,\n    COUNT(id) AS post_count,\n    RANK() OVER (PARTITION BY DATE_TRUNC('month', created_at) ORDER BY COUNT(id) DESC) as ranking\n  FROM posts\n  GROUP BY author_id, DATE_TRUNC('month', created_at)\n)\nSELECT * FROM monthly_stats WHERE ranking <= 5;`,

  html: `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>DevShare Platform</title>\n</head>\n<body>\n  <header class="app-header">\n    <h1>Welcome to DevShare</h1>\n  </header>\n</body>\n</html>`,

  css: `:root {\n  --primary: #3b82f6;\n  --surface: #0f172a;\n  --text: #f8fafc;\n}\n\n.card-container {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));\n  gap: 1.5rem;\n  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);\n}`,

  tailwind: `<div class="max-w-md mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden md:max-w-2xl border border-slate-200 dark:border-slate-800 p-6">\n  <div class="flex items-center space-x-4">\n    <div class="h-12 w-12 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-xl">DS</div>\n    <div>\n      <div class="text-sm font-semibold text-indigo-500 uppercase tracking-wide">Developer Hub</div>\n      <p class="text-slate-500 dark:text-slate-400 text-sm">Building software faster together.</p>\n    </div>\n  </div>\n</div>`,

  cpp: `#include <iostream>\n#include <vector>\n#include <algorithm>\n\nint main() {\n    std::vector<int> numbers = {42, 17, 89, 5, 23};\n    std::sort(numbers.begin(), numbers.end());\n\n    std::cout << "Sorted elements: ";\n    for (const auto& n : numbers) {\n        std::cout << n << " ";\n    }\n    std::cout << std::endl;\n    return 0;\n}`,

  c: `#include <stdio.h>\n#include <stdlib.h>\n\ntypedef struct {\n    char username[32];\n    int karma;\n} DevUser;\n\nint main() {\n    DevUser* user = (DevUser*)malloc(sizeof(DevUser));\n    snprintf(user->username, sizeof(user->username), "admin");\n    user->karma = 1024;\n    printf("User: %s | Karma: %d\\n", user->username, user->karma);\n    free(user);\n    return 0;\n}`,

  csharp: `using System;\nusing System.Threading.Tasks;\nusing System.Collections.Generic;\n\npublic record Post(Guid Id, string Title, string Author);\n\npublic class DevShareService {\n    public async Task<List<Post>> GetTrendingAsync() {\n        await Task.Delay(50);\n        return new List<Post> {\n            new(Guid.NewGuid(), "Modern .NET 9 Features", "alex_dev")\n        };\n    }\n}`,

  java: `package com.devshare.api;\n\nimport org.springframework.web.bind.annotation.*;\nimport java.util.Map;\n\n@RestController\n@RequestMapping("/api/v1/posts")\npublic class PostController {\n    @GetMapping("/{id}")\n    public Map<String, Object> getPost(@PathVariable String id) {\n        return Map.of("id", id, "title", "Spring Boot 3.4 Microservice", "votes", 42);\n    }\n}`,

  go: `package main\n\nimport (\n\t"encoding/json"\n\t"net/http"\n\t"log"\n)\n\ntype StatusResponse struct {\n\tStatus  string \`json:"status"\`\n\tVersion string \`json:"version"\`\n}\n\nfunc main() {\n\thttp.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {\n\t\tw.Header().Set("Content-Type", "application/json")\n\t\tjson.NewEncoder(w).Encode(StatusResponse{Status: "ok", Version: "1.0"})\n\t})\n\tlog.Fatal(http.ListenAndServe(":8080", nil))\n}`,

  rust: `use std::error::Error;\n\n#[derive(Debug)]\npub struct DevPost {\n    pub title: String,\n    pub upvotes: u32,\n}\n\nfn process_post(post: &DevPost) -> Result<String, Box<dyn Error>> {\n    if post.upvotes > 100 {\n        Ok(format!("Trending: {}", post.title))\n    } else {\n        Ok(format!("Regular: {}", post.title))\n    }\n}`,

  php: `<?php\ndeclare(strict_types=1);\n\nnamespace App\\Services;\n\nreadonly class UserService {\n    public function __construct(private \\PDO $pdo) {}\n\n    public function findUserById(int $id): ?array {\n        $stmt = $this->pdo->prepare('SELECT id, username, email FROM users WHERE id = :id');\n        $stmt->execute(['id' => $id]);\n        return $stmt->fetch(\\PDO::FETCH_ASSOC) ?: null;\n    }\n}`,

  ruby: `# frozen_string_literal: true\n\nclass PostsController < ApplicationController\n  before_action :authenticate_user!, only: [:create]\n\n  def index\n    @posts = Post.includes(:author).where(status: :published).order(created_at: :desc).limit(20)\n    render json: @posts\n  end\nend`,

  swift: `import SwiftUI\n\nstruct PostRowView: View {\n    let title: String\n    let votes: Int\n\n    var body: some View {\n        HStack {\n            VStack(alignment: .leading) {\n                Text(title).font(.headline)\n                Text("\\(votes) upvotes").font(.caption).foregroundColor(.secondary)\n            }\n            Spacer()\n        }\n        .padding(.vertical, 8)\n    }\n}`,

  kotlin: `package com.devshare\n\nimport kotlinx.coroutines.*\n\ndata class Community(val id: String, val name: String, val memberCount: Int)\n\nsuspend fun fetchCommunityDetails(id: String): Community = withContext(Dispatchers.IO) {\n    delay(100) // Simulated network\n    Community(id = id, name = "kotlin-lang", memberCount = 12500)\n}`,

  dart: `import 'package:flutter/material.dart';\n\nclass CommunityBadge extends StatelessWidget {\n  final String name;\n  const CommunityBadge({super.key, required this.name});\n\n  @override\n  Widget build(BuildContext context) {\n    return Chip(\n      avatar: CircleAvatar(child: Text(name[0].toUpperCase())),\n      label: Text('d/' + name),\n    );\n  }\n}`,

  bash: `#!/usr/bin/env bash\nset -euo pipefail\n\nBACKEND_PORT=3001\nFRONTEND_PORT=5173\n\necho "Checking DevShare local environment..."\nif curl -sf "http://localhost:\${BACKEND_PORT}/" > /dev/null; then\n  echo "✓ Backend API is reachable on port \${BACKEND_PORT}"\nelse\n  echo "✗ Backend is not running." >&2\n  exit 1\nfi`,

  powershell: `# Check status of local DevShare services\n$ports = @(3001, 5173, 5433)\nforeach ($port in $ports) {\n    $conn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue\n    if ($conn) {\n        Write-Host "✓ Port $port is active and listening" -ForegroundColor Green\n    } else {\n        Write-Warning "✗ Port $port is closed"\n    }\n}`,

  dockerfile: `FROM oven/bun:1.4-alpine AS base\nWORKDIR /app\n\nCOPY package.json bun.lock* ./\nRUN bun install --frozen-lockfile\n\nCOPY . .\nRUN bunx prisma generate\n\nEXPOSE 3001\nCMD ["bun", "run", "src/index.ts"]`,

  yaml: `name: CI Pipeline\non: [push, pull_request]\njobs:\n  verify:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: oven-sh/setup-bun@v2\n        with:\n          bun-version: latest\n      - run: bun install\n      - run: bun test`,

  json: `{\n  "appName": "DevShare",\n  "version": "2.2.0",\n  "features": {\n    "notebookEditor": true,\n    "syntaxHighlighting": true,\n    "globalCodeCatalog": true\n  },\n  "supportedLanguagesCount": 35\n}`,

  graphql: `type Post {\n  id: ID!\n  title: String!\n  content: String\n  author: User!\n  createdAt: String!\n  votesCount: Int!\n}\n\ntype Query {\n  feed(filter: String, limit: Int = 10): [Post!]!\n}\n\nmutation CreatePost($title: String!, $content: String!) {\n  createPost(title: $title, content: $content) {\n    id\n    title\n  }\n}`,

  markdown: `# DevShare Architecture Overview\n\nModern developer platform built with high performance in mind.\n\n| Layer | Technology | Role |\n|---|---|---|\n| Frontend | React 19 + Vite | SPA Interface |\n| Backend | Bun + Elysia | Async API Server |\n| Database | PostgreSQL 16 | ACID Relational Store |`,

  r: `# R statistical data analysis\nlibrary(ggplot2)\n\ntech_data <- data.frame(\n  framework = c("Bun", "Node.js", "Go", "Rust"),\n  throughput = c(120, 45, 110, 140)\n)\n\nsummary(tech_data$throughput)\nggplot(tech_data, aes(x = framework, y = throughput)) + geom_col(fill = "steelblue")`,

  scala: `package com.devshare.model\n\ncase class Article(id: String, title: String, tags: List[String], views: Long)\n\nobject ArticleAnalyzer {\n  def summarize(article: Article): String = article match {\n    case Article(_, title, tags, views) if views > 1000 =>\n      s"Popular Article: $title (\${tags.mkString(", ")})"\n    case Article(_, title, _, _) =>\n      s"Standard Article: $title"\n  }\n}`,

  lua: `-- Lua game scripting / Neovim plugin config\nlocal M = {}\n\nM.setup = function(opts)\n  opts = opts or {}\n  local config = {\n    theme = opts.theme or "devshare-dark",\n    indent = 2,\n    auto_format = true\n  }\n  print("Configured DevShare Lua Plugin: " .. config.theme)\n  return config\nend\n\nreturn M`,

  solidity: `// SPDX-License-Identifier: MIT\npragma solidity ^0.8.20;\n\ncontract DevShareBadge {\n    string public name = "DevShare Contributor";\n    string public symbol = "DSC";\n    mapping(address => uint256) public karmaBalances;\n\n    event KarmaAwarded(address indexed recipient, uint256 amount);\n\n    function awardKarma(address recipient, uint256 amount) external {\n        karmaBalances[recipient] += amount;\n        emit KarmaAwarded(recipient, amount);\n    }\n}`,

  elixir: `defmodule DevShare.Feed do\n  use GenServer\n\n  def start_link(default) do\n    GenServer.start_link(__MODULE__, default)\n  end\n\n  def filter_posts(posts, min_votes) do\n    posts\n    |> Enum.filter(fn post -> post.votes >= min_votes end)\n    |> Enum.sort_by(& &1.created_at, :desc)\n  end\nend`,

  zig: `const std = @import("std");\n\npub fn main() !void {\n    const stdout = std.io.getStdOut().writer();\n    var gpa = std.heap.GeneralPurposeAllocator(.{}){};\n    defer _ = gpa.deinit();\n\n    const message = "Hello from Zig high-performance engine!\\n";\n    try stdout.print("{s}", .{message});\n}`
}
