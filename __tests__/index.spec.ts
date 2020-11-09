import markdownIt from "markdown-it";
import mdFence from "../src";

const res = "I'm testing";

test("main", () => {
  expect(typeof mdFence).toBe("function");
});

test("name unmatched", () => {
  const md = markdownIt();
  const testStr = `
\`\`\`test
I'm testing
\`\`\`
  `;

  const plugin = () =>
    mdFence(md, "mytest", {
      render: () => res,
    });
  expect(md.use(plugin).render(testStr)).toBe(
    `<pre><code class="language-test">I'm testing\n</code></pre>\n`
  );
});

test("custom marker", () => {
  const md = markdownIt();
  const testStr = `
:::test
I'm testing
:::
  `;
  const plugin = () => {
    mdFence(md, "test", {
      marker: ":",
      render: () => res,
    });
  };

  expect(md.use(plugin).render(testStr)).toBe(res);
});

test("default render test", () => {
  const md = markdownIt();
  const testStr = `
\`\`\`
# Header1
\`\`\`

### Header3
  `;

  const text = `<pre><code># Header1
</code></pre>
<h3>Header3</h3>
`;

  const plugin = () => {
    mdFence(md, "test");
  };

  expect(md.use(plugin).render(testStr)).toBe(text);
});

test("custom render", () => {
  const md = markdownIt();
  const testStr = `
***customrender
world
***
`;

  const plugin = () => {
    mdFence(md, "customrender", {
      marker: "*",
      render: (tokens, idx) => ("hello " + tokens[idx].content).trim(),
    });
  };

  expect(md.use(plugin).render(testStr)).toBe("hello world");
});

test("custom render with wrapping", () => {
  const md = markdownIt();
  const testStr = `
:::customrender

*hello world*

\`\`\`js
function() {
  console.log('hi')
}
\`\`\`

:::customrender
__bar__
:::

:::
`;

  const plugin = () => {
    mdFence(md, "customrender", {
      marker: ":",
      render: (tokens, idx, options, env, self) => {
        return `<div class="bar">${md.render(tokens[idx].content)}</div>`;
      },
    });
  };

  const renderedString = md.use(plugin).render(testStr);

  expect(renderedString).toEqual(
    `<div class="bar"><p><em>hello world</em></p>\n<pre><code class="language-js">function() {\n  console.log('hi')\n}\n</code></pre>\n<div class="bar"><p><strong>bar</strong></p>\n</div></div><pre><code></code></pre>\n`
  );
});
