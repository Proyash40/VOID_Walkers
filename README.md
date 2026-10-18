```markdown
# Void Walkers — Deployment & Setup Guide

This guide provides the exact, step-by-step action plan to take the Void Walkers project from the local codebase to a fully functioning live deployment using Vercel, Go Serverless functions, and Supabase.

## Step 1: Configure Audio Assets
1. Drop your preferred background music file into the `assets/audio/` directory.
2. Ensure the file is named exactly `ambient-loop.mp3` so that `js/settings.js` can locate and play it without requiring any code modifications.

## Step 2: Set Up Supabase (Database)
1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard) and create a new project.
2. Navigate to the **SQL Editor** and run the following queries to establish the two required tables:

```sql
-- Table for home page members
create table mem_list (
  id bigint generated always as identity primary key,
  u_name text not null,
  role text,
  category text[] default '{}',
  description text,
  socials jsonb default '{}',
  created_at timestamptz default now()
);

-- Table for database.html event tracker
create table ctf_events (
  id bigint generated always as identity primary key,
  name text not null,
  format text,
  start_date date,
  status text,
  rank int,
  points int,
  url text
);

```

3. Go to the **Table Editor** > `mem_list` and insert at least one initial member row to populate the home page:
* **u_name**: `Saber`
* **role**: `Founder / Executive`
* **category**: `{"Leadership","Strategy"}`
* **description**: `Team Lead and Founder.`
* **socials**: `{"github": "https://github.com", "twitter": "https://x.com"}`


4. Go to **Project Settings** > **API** and copy the following credentials for later use:
* **Project URL**
* **service_role secret key**



## Step 3: Set Up the Go Backend Handlers

Create an `api/` directory at the project root for your Vercel serverless Go functions.

**1. Create `api/Members.go`:**

```go
package handler

import (
	"encoding/json"
	"io"
	"net/http"
	"os"
)

type MemberDB struct {
	ID          int64             `json:"id"`
	UName       string            `json:"u_name"`
	Role        string            `json:"role"`
	Category    []string          `json:"category"`
	Description string            `json:"description"`
	Socials     map[string]string `json:"socials"`
}

type MemberFrontend struct {
	ID          int64             `json:"id"`
	UName       string            `json:"uName"`
	Role        string            `json:"role"`
	Category    []string          `json:"category"`
	Description string            `json:"description"`
	Socials     map[string]string `json:"socials"`
}

func Members(w http.ResponseWriter, r *http.Request) {
	url := os.Getenv("SUPABASE_URL") + "/rest/v1/mem_list?select=*"
	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Set("apikey", os.Getenv("SUPABASE_SERVICE_ROLE_KEY"))
	req.Header.Set("Authorization", "Bearer "+os.Getenv("SUPABASE_SERVICE_ROLE_KEY"))

	resp, err := http.DefaultClient.Do(req)
	if err != nil || resp.StatusCode >= 400 {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Supabase unreachable"})
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var rawMembers []MemberDB
	json.Unmarshal(body, &rawMembers)

	// Map u_name snake_case from DB to uName camelCase expected by main.js
	var out []MemberFrontend
	for _, m := range rawMembers {
		out = append(out, MemberFrontend{
			ID:          m.ID,
			UName:       m.UName,
			Role:        m.Role,
			Category:    m.Category,
			Description: m.Description,
			Socials:     m.Socials,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(out)
}

```

**2. Create `api/Events.go`:**

```go
package handler

import (
	"encoding/json"
	"io"
	"net/http"
	"os"
)

func Events(w http.ResponseWriter, r *http.Request) {
	url := os.Getenv("SUPABASE_URL") + "/rest/v1/ctf_events?select=*"
	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Set("apikey", os.Getenv("SUPABASE_SERVICE_ROLE_KEY"))
	req.Header.Set("Authorization", "Bearer "+os.Getenv("SUPABASE_SERVICE_ROLE_KEY"))

	resp, err := http.DefaultClient.Do(req)
	if err != nil || resp.StatusCode >= 400 {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Supabase unreachable"})
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write(body)
}

```

## Step 4: Add Vercel Routing

Create a `vercel.json` file in the root folder to route the frontend API fetch calls to your newly created Go functions:

```json
{
  "rewrites": [
    { "source": "/api/Members", "destination": "/api/Members.go" },
    { "source": "/api/Events", "destination": "/api/Events.go" }
  ]
}

```

## Step 5: Test Locally

Run a local development server using the Vercel CLI (which seamlessly handles both static HTML/CSS/JS files and Go serverless routes).

```bash
# Install Vercel CLI if you haven't yet
npm i -g vercel

# Run development server
vercel dev

```

Create a `.env.local` file in the root directory and add your Supabase credentials:

```env
SUPABASE_URL=[https://your-project-id.supabase.co](https://your-project-id.supabase.co)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

```

*Verification:* Open `localhost:3000` (or the port specified by Vercel) and verify that the home page renders the black hole hero canvas, the member cards load from the database, the audio toggle plays the ambient loop, and the `database.html` table pulls events from Supabase.

## Step 6: Deploy to Vercel

1. Push your repository to GitHub.
2. Import the repository into your Vercel account.
3. Under **Project Settings** > **Environment Variables**, add:
* `SUPABASE_URL`
* `SUPABASE_SERVICE_ROLE_KEY`


4. Click **Deploy**. Vercel natively supports HTTP byte-range requests, ensuring the ambient music loop resumes smoothly across page navigations without breaking.

```

```
