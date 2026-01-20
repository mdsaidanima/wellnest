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
                "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80" // Healthy Food Image
            ));

            blogPostRepository.save(new BlogPost(
                "The Ultimate 20-Minute HIIT Workout",
                "Short on time? This high-intensity interval training routine will help you burn calories and build strength in just 20 minutes.",
                "Coach Alex",
                0L,
                "Fitness",
                "ARTICLE",
                "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80" // Gym/Workout Image
            ));

            blogPostRepository.save(new BlogPost(
                "Mindfulness: The Key to Stress Relief",
                "Practicing mindfulness meditation for just 10 minutes a day can lower stress hormones and improve your overall mental well-being.",
                "Zen Master",
                0L,
                "Mental Wellness",
                "ARTICLE",
                "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&q=80" // Yoga/Meditation Image
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
