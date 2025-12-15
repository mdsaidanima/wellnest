package com.wellnest.wellnest.repository;

import com.wellnest.wellnest.model.BlogPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BlogPostRepository extends JpaRepository<BlogPost, Long> {
    List<BlogPost> findAllByOrderByCreatedAtDesc();
    List<BlogPost> findByPostTypeOrderByCreatedAtDesc(String postType);
}
