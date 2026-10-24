# Assignment 3 brief

Source: the supplied course [screenshot](assignment3-source.png). English text is transcribed verbatim; only Markdown layout is adjusted. These are course requirements, not actions performed by this documentation task. See the [project TODO](../TODO.md).

### Assignment 3: An interactive experience

Individual project | Weight: 15% | Marked out of 15

Due: Sunday 1 November 2026, 23:59 Hong Kong time

### The brief

Make a small interactive experience for someone to use. Begin with a clear idea: who is it for, what can they do, and what should happen because of their action? Your program should turn that idea into a working loop of input, response and feedback. The person should be able to see or hear what changed and decide what to do next.

A website, an interactive artwork, a branching survey, a playful tool or a command-line experience can all work. Choose a scope you can finish, explain and test. One carefully designed interaction is enough. A small experience that responds well is more useful than a large collection of unfinished features.

You may build on a course example or extend your data visualisation, but explain what you added and why. A static picture, a video with no user control, or an unchanged tutorial example does not demonstrate the interaction required here.

### What the experience should do

- Accept a deliberate user action: a click, a key, a choice, typed text, a slider or another input that suits your idea.
- Produce a meaningful response. The input should change what the program does, rather than simply decorate a page.
- Give clear feedback so the person can tell what happened. Make the next action understandable, including how to reset, go back or stop when relevant.
- Handle an ordinary mistake or interruption sensibly: empty input, a repeated click, a missing file, denied permission or an unavailable service.

Images, animation, sound and AI models are possible materials. None is required. You do not need a paid account, a powerful GPU or a microphone. If you use a service or local model, describe the setup and provide a sample or demonstration that lets a marker understand the interaction when that dependency is unavailable.

### Try it with someone

Ask at least one other person to try the experience before you explain how it works. Observe what they attempt, where they hesitate and whether the response makes sense. Make one improvement based on what you observed, or explain why you kept the design as it was. Record the observation and decision in `PROCESS.md`; you do not need to identify the person.

### What to submit

Submit the URL of a public GitHub repository on your own account through this Canvas assignment. Give it a project name and include:

1. The working source and necessary assets. Keep dependencies documented. For Python, provide exact `uv` commands and the required dependency metadata or requirements file. For a browser project, explain how to serve and open it.
2. `README.md`. Explain the idea, intended user, main interaction, how to run it, and any known limitations. Include a screenshot and, if available, a live link. A short screen recording is useful for sound, animation or a local app.
3. `PROCESS.md`. Describe your starting idea, a design or code change you made, the user trial and your response to it. Explain which AI tools you used and for what, including one suggestion you kept and one you changed or rejected when applicable. If you used no AI, say so.
4. Credits and a visible development history. Credit borrowed code, data and media, including course examples. Commit as the project develops so the history shows decisions and revisions.

Keep API keys, personal information and recordings of other people out of the public repository. Use material you have permission to share. Check that the repository link opens when you are signed out of GitHub.

### How it is marked

| Criterion | Points | What we look for |
|---|---:|---|
| Interaction and design | 5 | A clear intention and a meaningful relationship between the user's action, the program's response and its feedback. |
| Working implementation | 4 | The main interaction runs, the code supports the idea, and the setup and dependencies are clear enough to reproduce. |
| Usability and iteration | 3 | Understandable controls and feedback, sensible handling of a relevant error, and evidence from a user trial that informed a decision. |
| Process and communication | 3 | A useful README, honest account of tools and decisions, appropriate credits and a development history. |
| Total | 15 | |

Visual polish matters when it helps the experience communicate. More features, more complex code or use of AI do not automatically earn more marks. Be ready to explain one piece of the program that connects a user action to a response.

### Before you submit

- Follow your own run instructions from a fresh terminal and try the main action.
- Try the mistake or interruption you chose to handle.
- Check that the source, required assets, README, PROCESS and credits are present.
- Submit the repository URL on Canvas before the deadline.
