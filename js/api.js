/* ==========================================================================
   Void Walkers — API Layer
   Centralized fetch logic for the Go/Echo backend. Every network call the
   site makes goes through this file. Endpoints are limited to the ones the
   backend actually exposes: /api/Members and /api/Events.
   ========================================================================== */

const API_ENDPOINTS = {
  members: "/api/Members",
  events: "/api/Events",
};

const DEFAULT_ERROR_MESSAGE =
  "Something went wrong while reaching the server. Please try again shortly.";

/**
 * Performs a GET request against a Void Walkers API endpoint and normalizes
 * the result into a consistent { ok, data, error } shape so callers never
 * need their own try/catch around a fetch call.
 *
 * @param {string} url
 * @returns {Promise<{ ok: boolean, data: any|null, error: string|null }>}
 */
async function requestJSON(url) {
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      let serverMessage = "";
      try {
        const errorBody = await response.json();
        serverMessage = errorBody && (errorBody.error || errorBody.message);
      } catch (parseError) {
        serverMessage = "";
      }

      if (response.status === 500) {
        return {
          ok: false,
          data: null,
          error:
            serverMessage ||
            "The server hit an internal error while fetching this data. The team has been notified.",
        };
      }

      if (response.status === 404) {
        return {
          ok: false,
          data: null,
          error: serverMessage || "That endpoint could not be found.",
        };
      }

      return {
        ok: false,
        data: null,
        error: serverMessage || `Request failed with status ${response.status}.`,
      };
    }

    const data = await response.json();
    return { ok: true, data, error: null };
  } catch (networkError) {
    return {
      ok: false,
      data: null,
      error:
        networkError && networkError.message
          ? `Network error: ${networkError.message}`
          : DEFAULT_ERROR_MESSAGE,
    };
  }
}

/**
 * Fetches the crew roster from /api/Members.
 * Resolves to { ok, data, error }. `data` is the raw array of member
 * records served by the Supabase-backed Go handler.
 */
async function fetchMembers() {
  return requestJSON(API_ENDPOINTS.members);
}

/**
 * Fetches the CTF event log from /api/Events.
 * Resolves to { ok, data, error }.
 */
async function fetchEvents() {
  return requestJSON(API_ENDPOINTS.events);
}
