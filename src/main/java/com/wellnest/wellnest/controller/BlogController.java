package com.wellnest.wellnest.controller;

import com.wellnest.wellnest.model.BlogPost;
import com.wellnest.wellnest.model.Comment;
import com.wellnest.wellnest.repository.BlogPostRepository;
import com.wellnest.wellnest.repository.CommentRepository;
import com.wellnest.wellnest.repository.UserRepository;
import com.wellnest.wellnest.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/blog")
@CrossOrigin
public class BlogController {

    @Autowired
    private BlogPostRepository blogPostRepository;

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private UserRepository userRepository;

    @jakarta.annotation.PostConstruct
    public void init() {
        seedPosts();
    }

    private void seedPosts() {
        if (blogPostRepository.count() == 0) {
            blogPostRepository.save(new BlogPost(
                "10 Superfoods for a Healthy Life",
                "Incorporating superfoods like berries, leafy greens, and nuts into your diet can significantly boost your immune system and energy levels.",
                "Dr. Nutrition",
                0L, 
                "Nutrition",
                "ARTICLE",
                "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80"
            ));

            blogPostRepository.save(new BlogPost(
                "The Ultimate 20-Minute HIIT",
                "Short on time? This high-intensity interval training routine will help you burn calories and build strength in just 20 minutes.",
                "Coach Alex",
                0L,
                "Fitness",
                "ARTICLE",
                "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80"
            ));

            blogPostRepository.save(new BlogPost(
                "Mindfulness: Key to Stress Relief",
                "Practicing mindfulness meditation for just 10 minutes a day can lower stress hormones and improve your overall well-being.",
                "Zen Master",
                0L,
                "Mental Wellness",
                "ARTICLE",
                "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&q=80"
            ));

            blogPostRepository.save(new BlogPost(
                "Why Hydration Matters",
                "Drinking enough water is crucial for maintaining energy, digestion, and skin health. Learn how much you really need.",
                "Health Daily",
                0L,
                "Health",
                "ARTICLE",
                "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=800&q=80"
            ));

            blogPostRepository.save(new BlogPost(
                "5 Tips for Better Sleep",
                "Struggling to sleep? Try these 5 scientifically proven tips to improve your sleep quality tonight.",
                "Dr. Sleep",
                0L,
                "Wellness",
                "ARTICLE",
                "https://images.unsplash.com/photo-1541781777621-af13943727dd?w=800&q=80"
            ));

            blogPostRepository.save(new BlogPost(
                "Plant-Based Diet Guide",
                "Thinking about going plant-based? Here is a simple guide to getting started without feeling overwhelmed.",
                "Veggie Life",
                0L,
                "Nutrition",
                "ARTICLE",
                "https://images.unsplash.com/photo-1511690656952-34342d5c71df?w=800&q=80"
            ));

            blogPostRepository.save(new BlogPost(
                "Post-Workout Recovery Tips",
                "What you do after your workout is just as important as the workout itself. Discover the best recovery secrets.",
                "Fitness Pro",
                0L,
                "Fitness",
                "ARTICLE",
                "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80"
            ));

            blogPostRepository.save(new BlogPost(
                "Maintaining Mental Glow",
                "Self-care isn't selfish. Learn how to maintain your mental glow in a fast-paced world with these simple habits.",
                "Wellness Guru",
                0L,
                "Mental Wellness",
                "ARTICLE",
                "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80"
            ));

            blogPostRepository.save(new BlogPost(
                "Meal Prep Like a Pro",
                "Save time and eat healthier by spending just two hours on Sunday preparing your meals for the entire week.",
                "Chef Healthy",
                0L,
                "Nutrition",
                "ARTICLE",
                "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80"
            ));

            // Community Posts (Text-only captions)
            blogPostRepository.save(new BlogPost(
                "Feeling Great After My First Week!",
                "Just finished my first 7 days with WellNest. I've logged every workout and stayed under my calorie goal. Consistency is key! 🚀",
                "Said Anima",
                0L,
                "Progress",
                "USER_POST",
                "" // Empty image URL
            ));

            blogPostRepository.save(new BlogPost(
                "Looking for a Workout Buddy",
                "Anyone in the downtown area looking to hit the gym together on Monday mornings? Let's stay motivated! 💪",
                "Sarah Parker",
                0L,
                "Fitness",
                "USER_POST",
                null // Null image URL
            ));

            blogPostRepository.save(new BlogPost(
                "Daily Hydration Reminder! 💧",
                "Don't forget to drink your water today folks! I'm already at 2 liters and feeling much more focused.",
                "Mike Thompson",
                0L,
                "Health",
                "USER_POST",
                "" 
            ));
        }
    }

    // Force reset blog data
    @GetMapping("/reset")
    public String resetBlogs() {
        commentRepository.deleteAll(); // Delete comments first due to FK
        blogPostRepository.deleteAll();
        seedPosts();
        return "Blog posts reset successfully!";
    }

    // Get all posts (Articles + Community)
    @GetMapping
    public List<BlogPost> getAllPosts() {
        return blogPostRepository.findAllByOrderByCreatedAtDesc();
    }

    // Get posts by type (e.g., "ARTICLE" or "USER_POST")
    @GetMapping("/type/{type}")
    public List<BlogPost> getPostsByType(@PathVariable String type) {
        return blogPostRepository.findByPostTypeOrderByCreatedAtDesc(type);
    }

    // Create a new post
    @PostMapping
    public ResponseEntity<?> createPost(@RequestBody Map<String, String> payload) {
        String email = payload.get("userEmail");
        if (email == null) {
            return ResponseEntity.badRequest().body("User email is required");
        }

        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().body("User not found");
        }

        BlogPost post = new BlogPost();
        post.setTitle(payload.get("title"));
        post.setContent(payload.get("content"));
        post.setCategory(payload.get("category"));
        post.setImageUrl(payload.get("imageUrl")); // Add this
        
        String postType = payload.get("postType");
        post.setPostType((postType == null || postType.isEmpty()) ? "USER_POST" : postType);
        
        post.setAuthorName(user.getFullName());
        post.setAuthorId(user.getId());
        post.setCreatedAt(LocalDateTime.now());

        BlogPost savedPost = blogPostRepository.save(post);
        return ResponseEntity.ok(savedPost);
    }

    // Delete a post
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePost(@PathVariable Long id, @RequestParam String userEmail) {
        User user = userRepository.findByEmail(userEmail).orElse(null);
        if (user == null) return ResponseEntity.badRequest().body("User not found");

        return blogPostRepository.findById(id).map(post -> {
            if (post.getAuthorId().equals(user.getId())) {
                blogPostRepository.delete(post);
                return ResponseEntity.ok().build();
            } else {
                return ResponseEntity.status(403).body("Not authorized to delete this post");
            }
        }).orElse(ResponseEntity.notFound().build());
    }

    // Edit a post
    @PutMapping("/{id}")
    public ResponseEntity<?> updatePost(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String email = payload.get("userEmail");
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) return ResponseEntity.badRequest().body("User not found");

        return blogPostRepository.findById(id).map(post -> {
            if (post.getAuthorId().equals(user.getId())) {
                post.setTitle(payload.get("title"));
                post.setContent(payload.get("content"));
                post.setCategory(payload.get("category"));
                post.setImageUrl(payload.get("imageUrl"));
                return ResponseEntity.ok(blogPostRepository.save(post));
            } else {
                return ResponseEntity.status(403).body("Not authorized to edit this post");
            }
        }).orElse(ResponseEntity.notFound().build());
    }

    // Like a post
    @PostMapping("/{id}/like")
    public ResponseEntity<BlogPost> likePost(@PathVariable Long id) {
        return blogPostRepository.findById(id).map(post -> {
            post.incrementLikes();
            return ResponseEntity.ok(blogPostRepository.save(post));
        }).orElse(ResponseEntity.notFound().build());
    }

    // Add a comment
    @PostMapping("/{id}/comments")
    public ResponseEntity<?> addComment(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String email = payload.get("userEmail");
        String content = payload.get("content");
        
        if (email == null || content == null) {
            return ResponseEntity.badRequest().body("Email and content are required");
        }

        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) return ResponseEntity.badRequest().body("User not found");

        return blogPostRepository.findById(id).map(post -> {
            Comment comment = new Comment();
            comment.setContent(content);
            comment.setAuthorName(user.getFullName());
            comment.setAuthorId(user.getId());
            comment.setCreatedAt(LocalDateTime.now());
            comment.setBlogPost(post);
            return ResponseEntity.ok(commentRepository.save(comment));
        }).orElse(ResponseEntity.notFound().build());
    }

    // Get comments for a post
    @GetMapping("/{id}/comments")
    public List<Comment> getComments(@PathVariable Long id) {
        return commentRepository.findByBlogPostIdOrderByCreatedAtDesc(id);
    }
}
