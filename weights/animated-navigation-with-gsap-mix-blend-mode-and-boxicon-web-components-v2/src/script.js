class NavigationEffect {
  constructor(navigation) {
    this.previous = null;
    this.current = null;
    this.navigation = navigation;
    this.anchors = this.navigation.querySelectorAll("a");

    this.anchors.forEach((anchor) => {
      anchor.addEventListener("click", (e) => {
        this.handlePrevious();
        this.handleCurrent(anchor);
      });
    });
  }

  handleCurrent(current) {
    this.current = current;
    this.current.classList.toggle("active");
    const nodes = this.getNodes(this.current);

    gsap.to(nodes[0], {
      duration: 1.8,
      ease: "elastic.out(1.4, 0.4)",
      yPercent: "-100",
      stagger: 0.008,
      overwrite: true
    });

    gsap.to(nodes[1], {
      duration: 1.8,
      ease: "elastic.out(1.4, 0.4)",
      yPercent: "-100",
      stagger: 0.008,
      overwrite: true
    });
  }

  handlePrevious() {
    this.previous = document.querySelector(".active");
    if (this.previous) {
      this.previous.classList.toggle("active");
      const nodes = this.getNodes(this.previous);
      gsap.to(nodes[0], {
        duration: 0.2,
        ease: "power1.out",
        yPercent: "100",
        overwrite: true,
        stagger: 0.012
      });

      gsap.to(nodes[1], {
        duration: 0.2,
        ease: "power1.out",
        yPercent: "100",
        overwrite: true,
        delay: 0.02,
        stagger: 0.012
      });
    }
  }

  getNodes(item) {
    return [
      gsap.utils.shuffle(gsap.utils.selector(item)(".blue rect")),
      gsap.utils.shuffle(gsap.utils.selector(item)(".pink rect"))
    ];
  }
}

document.addEventListener("DOMContentLoaded", () => {
  gsap.registerPlugin(EasePack);
  new NavigationEffect(document.querySelector("nav"));
});
