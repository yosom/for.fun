


    const canvas = document.getElementById("wave");
    const ctx = canvas.getContext("2d");

    const width = canvas.width;
    const height = canvas.height;
    const N = 500;
    const dx = 1;
    let t = 0;

    function draw() {
      ctx.clearRect(0, 0, width, height);
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.strokeStyle = "cyan";

      for (let i = 0; i < N; i++) {
        let x = (i - N / 2) * dx;
        let sigma = 30;
        let k0 = 0.2;

        // Gaussian envelope
        let envelope = Math.exp(-x * x / (2 * sigma * sigma));

        // Time-evolving wave: Re(ψ) = envelope * cos(kx - ωt)
        let real = envelope * Math.cos(k0 * x - 0.02 * t);

        let px = i * (width / N);
        let py = height / 2 - real * 100;

        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }

      ctx.stroke();

      // Optional: probability density (|ψ|²)
      ctx.beginPath();
      ctx.strokeStyle = "yellow";
      for (let i = 0; i < N; i++) {
        let x = (i - N / 2) * dx;
        let sigma = 30;
        let k0 = 0.2;
        let envelope = Math.exp(-x * x / (2 * sigma * sigma));
        let prob = envelope * envelope;

        let px = i * (width / N);
        let py = height / 2 - prob * 300;

        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      t += 1;
      requestAnimationFrame(draw);
    }

    draw();