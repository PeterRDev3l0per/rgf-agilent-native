import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEMO_EMAIL = "demo@clientos.app";
const DEMO_PASSWORD = "DemoClientOS!2026";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Check if demo user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const demoUser = existingUsers?.users?.find((u) => u.email === DEMO_EMAIL);

    let userId: string;

    if (demoUser) {
      userId = demoUser.id;
      console.log("Demo user already exists, resetting password:", userId);
      const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: DEMO_PASSWORD,
        email_confirm: true,
      });
      if (updErr) console.error("Failed to reset demo password:", updErr);
    } else {
      // Create demo user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: "Alex Chen" },
      });

      if (createError) throw createError;
      userId = newUser.user.id;
      console.log("Created demo user:", userId);

      // Create profile
      await supabaseAdmin.from("profiles").insert({
        user_id: userId,
        display_name: "Alex",
        full_name: "Alex Chen",
        avatar_color: "#4EA7FC",
      });

      // Create user role
      await supabaseAdmin.from("user_roles").insert({
        user_id: userId,
        role: "freelancer",
      });
    }

    // Idempotency: if we've already seeded the 5-client demo, exit early.
    const { data: existingProjects } = await supabaseAdmin
      .from("projects")
      .select("id, name")
      .eq("user_id", userId);

    if (existingProjects && existingProjects.length >= 5) {
      return new Response(
        JSON.stringify({ success: true, message: "Demo data already exists", userId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create 5 demo client teammates — one per project
    const teammates = [
      { email: "alex.acme@clientos.app", name: "Alex Rivera", color: "#EB5757", role: "client", project: "Acme Redesign" },
      { email: "sarah.northwind@clientos.app", name: "Sarah Chen", color: "#BB87FC", role: "client", project: "Northwind Marketing Site" },
      { email: "mike.globex@clientos.app", name: "Mike Johnson", color: "#2AFF71", role: "client", project: "Globex Mobile App" },
      { email: "priya.initech@clientos.app", name: "Priya Patel", color: "#4EA7FC", role: "client", project: "Initech Brand Refresh" },
      { email: "diego.hooli@clientos.app", name: "Diego Martinez", color: "#F2C94C", role: "client", project: "Hooli Dashboard" },
    ];

    const teammateIds: string[] = [];

    for (const teammate of teammates) {
      const existing = existingUsers?.users?.find((u) => u.email === teammate.email);
      
      if (existing) {
        teammateIds.push(existing.id);
        const { error: tErr } = await supabaseAdmin.auth.admin.updateUserById(existing.id, {
          password: DEMO_PASSWORD,
          email_confirm: true,
        });
        if (tErr) console.error("Failed to reset teammate password:", teammate.email, tErr);
      } else {
        const { data: newTeammate, error } = await supabaseAdmin.auth.admin.createUser({
          email: teammate.email,
          password: DEMO_PASSWORD,
          email_confirm: true,
          user_metadata: { full_name: teammate.name },
        });

        if (error) {
          console.error("Error creating teammate:", error);
          continue;
        }

        teammateIds.push(newTeammate.user.id);

        await supabaseAdmin.from("profiles").insert({
          user_id: newTeammate.user.id,
          display_name: teammate.name.split(" ")[0],
          full_name: teammate.name,
          avatar_color: teammate.color,
        });

        await supabaseAdmin.from("user_roles").insert({
          user_id: newTeammate.user.id,
          role: "client",
        });
      }
    }

    // 8 sample tasks across all four statuses (todo / inprogress / client_approval [aka blocked awaiting client] / done)
    // Distributed across the 5 client projects.
    const taskTemplates = [
      { title: "Kickoff & requirements", status: "done",             priority: "high",   tags: ["Design"] },
      { title: "Wireframes v1",         status: "done",             priority: "medium", tags: ["Design"] },
      { title: "Homepage build",        status: "inprogress",       priority: "high",   tags: ["Frontend"] },
      { title: "API integration",       status: "inprogress",       priority: "medium", tags: ["Backend"] },
      { title: "Brand color approval",  status: "client_approval",  priority: "high",   tags: ["Design"] },
      { title: "Copy sign-off",         status: "client_approval",  priority: "medium", tags: ["Design"] },
      { title: "Analytics dashboard",   status: "todo",             priority: "medium", tags: ["Feature"] },
      { title: "Fix Safari login bug",  status: "todo",             priority: "high",   tags: ["Bug"] },
    ];

    const projectIds: string[] = [];

    for (let p = 0; p < teammates.length; p++) {
      const clientMate = teammates[p];
      const clientId = teammateIds[p];
      if (!clientId) continue;

      // Create project
      const { data: project, error: projectError } = await supabaseAdmin
        .from("projects")
        .insert({ user_id: userId, name: clientMate.project, status: "active" })
        .select()
        .single();

      if (projectError || !project) {
        console.error("Error creating project:", projectError);
        continue;
      }
      projectIds.push(project.id);

      // Add the client as a project member (owner auto-added by trigger)
      await supabaseAdmin.from("project_members").insert({
        project_id: project.id,
        user_id: clientId,
        role: "client",
      });

      // Project tags
      const tags = [
        { name: "Frontend", color: "#4EA7FC" },
        { name: "Backend",  color: "#2AFF71" },
        { name: "Design",   color: "#BB87FC" },
        { name: "Bug",      color: "#EB5757" },
        { name: "Feature",  color: "#F2C94C" },
      ];
      const { data: createdTags } = await supabaseAdmin
        .from("project_tags")
        .insert(tags.map((t) => ({ ...t, project_id: project.id })))
        .select();
      const tagMap: Record<string, string> = (createdTags || []).reduce(
        (acc, t) => ({ ...acc, [t.name]: t.id }),
        {}
      );

      // Tasks
      for (let i = 0; i < taskTemplates.length; i++) {
        const t = taskTemplates[i];
        const { data: createdTask, error: taskError } = await supabaseAdmin
          .from("tasks")
          .insert({
            project_id: project.id,
            title: t.title,
            description: `<p>${t.title} for ${clientMate.project}.</p>`,
            status: t.status,
            priority: t.priority,
            client_visible: t.status === "client_approval" || t.status === "done",
            task_number: `TSK ${i + 1}`,
            created_by: userId,
            position: i * 1000,
          })
          .select()
          .single();

        if (taskError || !createdTask) continue;

        for (const tagName of t.tags) {
          const tagId = tagMap[tagName];
          if (tagId) {
            await supabaseAdmin.from("task_tags").insert({
              task_id: createdTask.id,
              tag_id: tagId,
            });
          }
        }

        // Owner assigned to every task; client assigned to client-visible ones
        await supabaseAdmin.from("task_assignees").insert({
          task_id: createdTask.id,
          user_id: userId,
        });

        // Recent activity: notify the demo user about client-approval tasks
        if (t.status === "client_approval") {
          await supabaseAdmin.from("notifications").insert({
            user_id: userId,
            project_id: project.id,
            task_id: createdTask.id,
            type: "task_awaiting_approval",
            title: `${clientMate.name} needs to approve "${t.title}"`,
            message: `Waiting on client review in ${clientMate.project}.`,
          });
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "Demo data created", projectIds }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
