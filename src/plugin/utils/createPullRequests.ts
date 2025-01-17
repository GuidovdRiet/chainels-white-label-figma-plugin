interface PullRequestConfig {
  repoSlug: string;
  branch: string;
  files: {
    content: string;
    path: string;
  }[];
  commitMessage: string;
  prTitle: string;
  prDescription: string;
}

// Simple base64 encoding function for Figma plugin environment
function base64Encode(str: string): string {
  const b64chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let result = "";
  let i = 0;

  do {
    const a = str.charCodeAt(i++);
    const b = str.charCodeAt(i++);
    const c = str.charCodeAt(i++);

    const enc1 = a >> 2;
    const enc2 = ((a & 3) << 4) | (b >> 4);
    const enc3 = ((b & 15) << 2) | (c >> 6);
    const enc4 = c & 63;

    result +=
      b64chars[enc1] +
      b64chars[enc2] +
      (isNaN(b) ? "=" : b64chars[enc3]) +
      (isNaN(c) ? "=" : b64chars[enc4]);
  } while (i < str.length);

  return result;
}

async function createBitbucketPR(
  config: PullRequestConfig,
  credentials: { username: string; token: string }
) {
  try {
    const { username, token } = credentials;
    console.log("Starting PR creation with username:", username);

    if (!username || !token) {
      throw new Error("Username and app password are required");
    }

    const baseUrl = "https://api.bitbucket.org/2.0";
    const workspace = "chainels";
    console.log("Using workspace:", workspace);
    console.log("Repository slug:", config.repoSlug);

    // Create authorization header with app password
    const auth = base64Encode(`${username}:${token}`);
    const headers = {
      Authorization: `Basic ${auth}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    };
    console.log("Headers set (excluding auth):", {
      Accept: headers.Accept,
      "Content-Type": headers["Content-Type"],
    });

    // 1. Check if branch exists and delete it if it does
    const branchUrl = `${baseUrl}/repositories/${workspace}/${config.repoSlug}/refs/branches/${config.branch}`;
    console.log("Checking if branch exists:", config.branch);

    try {
      const branchCheckResponse = await fetch(branchUrl, {
        method: "GET",
        headers,
      });

      if (branchCheckResponse.ok) {
        console.log("Branch exists, deleting it first");
        const deleteResponse = await fetch(branchUrl, {
          method: "DELETE",
          headers,
        });

        if (!deleteResponse.ok) {
          const errorText = await deleteResponse.text();
          console.error("Failed to delete existing branch:", errorText);
        } else {
          console.log("Existing branch deleted successfully");
        }
      } else {
        console.log("Branch does not exist, proceeding with creation");
      }
    } catch (error) {
      console.log("Error checking branch existence:", error);
    }

    // 2. Create new branch
    const branchCreateUrl = `${baseUrl}/repositories/${workspace}/${config.repoSlug}/refs/branches`;
    console.log("Creating branch:", config.branch);
    console.log("Branch creation URL:", branchCreateUrl);

    const branchPayload = {
      name: config.branch,
      target: {
        hash: "main",
      },
    };
    console.log("Branch creation payload:", branchPayload);

    const branchResponse = await fetch(branchCreateUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(branchPayload),
    });

    console.log("Branch creation response status:", branchResponse.status);
    if (!branchResponse.ok) {
      const errorText = await branchResponse.text();
      let parsedError;
      try {
        parsedError = JSON.parse(errorText);
        console.log("Parsed error response:", parsedError);
      } catch (e) {
        console.log("Raw error response:", errorText);
      }

      let errorMessage = `Branch creation failed (${branchResponse.status})`;

      if (branchResponse.status === 401) {
        errorMessage = `Authentication failed. Please check your app password.`;
      } else if (branchResponse.status === 403) {
        errorMessage = `Access denied. Please check if your app password has the required permissions.`;
      } else if (branchResponse.status === 400) {
        errorMessage =
          parsedError?.error?.message ||
          `Invalid request. Please check if the branch already exists or if the target branch is valid.`;
      }

      console.error(errorMessage, errorText);
      throw new Error(errorMessage);
    }

    console.log("Branch created successfully");

    // 3. Create commits for the files
    console.log("Starting file creation for", config.files.length, "files");
    for (const file of config.files) {
      console.log("Creating file:", file.path);
      const fileUrl = `${baseUrl}/repositories/${workspace}/${config.repoSlug}/src`;
      console.log("File creation URL:", fileUrl);

      // Create URL-encoded string manually
      const encodedBody = [
        `${encodeURIComponent(file.path)}=${encodeURIComponent(file.content)}`,
        `branch=${encodeURIComponent(config.branch)}`,
        `message=${encodeURIComponent(`Add ${file.path}`)}`,
      ].join("&");

      const fileResponse = await fetch(fileUrl, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: encodedBody,
      });

      console.log(
        `File ${file.path} creation response status:`,
        fileResponse.status
      );
      if (!fileResponse.ok) {
        const errorText = await fileResponse.text();
        console.error(
          `File creation failed for ${file.path} (${fileResponse.status}):`,
          errorText
        );
        throw new Error(`Failed to create file ${file.path}: ${errorText}`);
      }
      console.log(`File ${file.path} created successfully`);
    }

    // 4. Create pull request
    console.log("Starting PR creation");
    const prUrl = `${baseUrl}/repositories/${workspace}/${config.repoSlug}/pullrequests`;
    console.log("PR creation URL:", prUrl);
    const prPayload = {
      title: config.prTitle,
      description: config.prDescription,
      source: {
        branch: {
          name: config.branch,
        },
      },
      destination: {
        branch: {
          name: "main",
        },
      },
    };
    console.log("PR creation payload:", prPayload);

    const prResponse = await fetch(prUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(prPayload),
    });

    console.log("PR creation response status:", prResponse.status);
    if (!prResponse.ok) {
      const errorText = await prResponse.text();
      console.log("Full PR error response:", errorText);
      console.error(`PR creation failed (${prResponse.status}):`, errorText);
      throw new Error(`Failed to create PR: ${errorText}`);
    }

    console.log("PR created successfully");
    const result = await prResponse.json();
    console.log("PR creation result:", result);
    return result;
  } catch (error) {
    console.error("Error in createBitbucketPR:", error);
    throw error;
  }
}

export async function createPullRequests(
  whiteLabelName: string,
  files: {
    typescript: string;
    scss: string;
    scssEmail: string;
  },
  credentials: { username: string; token: string }
) {
  const repoConfig: PullRequestConfig = {
    repoSlug: "hackathon-white-label",
    branch: `feature/white-label-${whiteLabelName.toLowerCase()}`,
    files: [
      {
        content: files.typescript,
        path: `themes/${whiteLabelName}.brand.ts`,
      },
      {
        content: files.scss,
        path: `themes/${whiteLabelName}.colors.scss`,
      },
      {
        content: files.scssEmail,
        path: `themes/${whiteLabelName}.scss`,
      },
      {
        content: files.scssEmail,
        path: `themes/${whiteLabelName}-email.scss`,
      },
    ],
    commitMessage: `feat(white-label): add ${whiteLabelName} theme files`,
    prTitle: `Add ${whiteLabelName} white label theme`,
    prDescription: `Generated white label theme files for ${whiteLabelName}`,
  };

  return await createBitbucketPR(repoConfig, credentials);
}
